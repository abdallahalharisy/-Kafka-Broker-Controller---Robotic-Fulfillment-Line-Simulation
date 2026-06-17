import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { MockKafkaBroker } from './MockKafkaBroker';
import { ConsumerWorker } from './ConsumerWorker';
import { DLQManager } from './DLQManager';
import { MetricsSimulator } from './MetricsSimulator';
import { NetworkPartitionConfig } from './types';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const broker = new MockKafkaBroker();
const dlqManager = new DLQManager();
const consumer = new ConsumerWorker(broker, dlqManager);
const metricsSimulator = new MetricsSimulator(broker, dlqManager);

const connectedClients = new Set<WebSocket>();

function broadcastToClients(event: string, data: unknown): void {
  const message = JSON.stringify({ event, data });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket client connected');
  connectedClients.add(ws);

  ws.send(JSON.stringify({ 
    event: 'initial-state', 
    data: {
      partitions: broker.getAllPartitions('robotic-fulfillment-orders'),
      dlqEntries: dlqManager.getAllDLQEntries(),
      metrics: metricsSimulator.getMetrics(),
      logs: broker.getLogs(50),
      consumerActive: consumer.isActive()
    }
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
    connectedClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectedClients.delete(ws);
  });
});

broker.on('message-produced', (data) => {
  broadcastToClients('message-produced', data);
  broadcastToClients('partitions-updated', broker.getAllPartitions('robotic-fulfillment-orders'));
});

broker.on('offset-committed', () => {
  broadcastToClients('partitions-updated', broker.getAllPartitions('robotic-fulfillment-orders'));
});

broker.on('log', (log) => {
  broadcastToClients('log', log);
});

broker.on('network-partition-enabled', (config) => {
  broadcastToClients('network-partition-enabled', config);
});

broker.on('network-partition-disabled', () => {
  broadcastToClients('network-partition-disabled', {});
});

consumer.on('message-processing-started', (data) => {
  broadcastToClients('message-processing-started', data);
});

consumer.on('message-acked', (data) => {
  broadcastToClients('message-acked', data);
  broadcastToClients('partitions-updated', broker.getAllPartitions('robotic-fulfillment-orders'));
});

consumer.on('message-nacked', (data) => {
  broadcastToClients('message-nacked', data);
  broadcastToClients('partitions-updated', broker.getAllPartitions('robotic-fulfillment-orders'));
});

consumer.on('message-to-dlq', (data) => {
  broadcastToClients('message-to-dlq', data);
  broadcastToClients('dlq-updated', dlqManager.getAllDLQEntries());
  broadcastToClients('partitions-updated', broker.getAllPartitions('robotic-fulfillment-orders'));
});

dlqManager.on('message-diverted', () => {
  broadcastToClients('dlq-updated', dlqManager.getAllDLQEntries());
});

dlqManager.on('payload-updated', () => {
  broadcastToClients('dlq-updated', dlqManager.getAllDLQEntries());
});

dlqManager.on('message-resubmitted', () => {
  broadcastToClients('dlq-updated', dlqManager.getAllDLQEntries());
});

metricsSimulator.on('metrics-updated', (metrics) => {
  broadcastToClients('metrics-updated', metrics);
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/api/partitions', (req: Request, res: Response) => {
  const partitions = broker.getAllPartitions('robotic-fulfillment-orders');
  res.json(partitions);
});

app.post('/api/messages/produce', (req: Request, res: Response) => {
  try {
    const { payload, key } = req.body;
    
    if (!payload) {
      return res.status(400).json({ error: 'Payload is required' });
    }

    const message = broker.produce('robotic-fulfillment-orders', payload, key);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/messages/produce-poison', (req: Request, res: Response) => {
  try {
    const { itemId = 'poison_item' } = req.body;
    const payload = `${itemId}:fail`;
    
    const message = broker.produce('robotic-fulfillment-orders', payload);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/messages/produce-offset27', (req: Request, res: Response) => {
  try {
    let currentOffset = -1;
    let targetPartition = -1;

    for (let i = 0; i < 4; i++) {
      const partition = broker.getPartition('robotic-fulfillment-orders', i);
      if (partition && partition.logEndOffset === 27) {
        currentOffset = 27;
        targetPartition = i;
        break;
      }
    }

    if (currentOffset === -1) {
      for (let i = 0; i < 4; i++) {
        const partition = broker.getPartition('robotic-fulfillment-orders', i);
        if (partition && partition.logEndOffset < 27) {
          const needed = 27 - partition.logEndOffset;
          for (let j = 0; j < needed; j++) {
            broker.produce('robotic-fulfillment-orders', `filler_item_${i}_${j}`);
          }
        }
      }
    }

    const message = broker.produce('robotic-fulfillment-orders', 'engineered_poison_pill_offset_27:fail', 'offset27');
    
    res.json({ 
      success: true, 
      message,
      note: 'Engineered poison pill at offset #27 will fail exactly 3 times before DLQ diversion'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.get('/api/dlq', (req: Request, res: Response) => {
  const entries = dlqManager.getAllDLQEntries();
  res.json(entries);
});

app.patch('/api/dlq/:dlqId/payload', (req: Request, res: Response) => {
  try {
    const { dlqId } = req.params;
    const { payload } = req.body;

    if (!payload) {
      return res.status(400).json({ error: 'Payload is required' });
    }

    const success = dlqManager.updatePayload(dlqId, payload);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'DLQ entry not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/dlq/:dlqId/resubmit', (req: Request, res: Response) => {
  try {
    const { dlqId } = req.params;
    const entry = dlqManager.getDLQEntry(dlqId);

    if (!entry) {
      return res.status(404).json({ error: 'DLQ entry not found' });
    }

    const newMessage = broker.produce('robotic-fulfillment-orders', entry.message.payload);
    
    dlqManager.markAsResubmitted(dlqId);

    res.json({ 
      success: true, 
      newMessage,
      note: 'Message resubmitted to topic with fresh lifecycle'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.delete('/api/dlq/:dlqId', (req: Request, res: Response) => {
  try {
    const { dlqId } = req.params;
    const success = dlqManager.deleteEntry(dlqId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'DLQ entry not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/consumer/start', (req: Request, res: Response) => {
  try {
    consumer.start();
    res.json({ success: true, status: 'started' });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/consumer/stop', (req: Request, res: Response) => {
  try {
    consumer.stop();
    res.json({ success: true, status: 'stopped' });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.get('/api/consumer/status', (req: Request, res: Response) => {
  res.json({ 
    active: consumer.isActive(),
    currentlyProcessing: Array.from(consumer.getCurrentlyProcessing().entries())
      .map(([partition, message]) => ({ partition, message }))
  });
});

app.post('/api/network-partition', (req: Request, res: Response) => {
  try {
    const config: NetworkPartitionConfig = req.body;
    broker.setNetworkPartition(config);
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.get('/api/metrics', (req: Request, res: Response) => {
  const metrics = metricsSimulator.getMetrics();
  res.json(metrics);
});

app.get('/api/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = broker.getLogs(limit);
  res.json(logs);
});

app.delete('/api/logs', (req: Request, res: Response) => {
  broker.clearLogs();
  res.json({ success: true });
});

consumer.start();
metricsSimulator.start();

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🚀 Kafka Broker Controller - Robotic Fulfillment Line      ║
║   Backend Server Started Successfully                          ║
╠════════════════════════════════════════════════════════════════╣
║   HTTP API:      http://localhost:${PORT}                        ║
║   WebSocket:     ws://localhost:${PORT}                          ║
║   Status:        ✓ Broker Active                              ║
║                  ✓ Consumer Running                           ║
║                  ✓ Metrics Collection Active                  ║
╚════════════════════════════════════════════════════════════════╝
  `);
  
  broker.addLog('INFO', 'Server', `Backend server started on port ${PORT}`);
});

export { app, server, broker, consumer, dlqManager, metricsSimulator };
