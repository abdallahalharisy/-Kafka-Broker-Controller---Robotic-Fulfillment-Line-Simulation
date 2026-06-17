# 🚀 Kafka Broker Controller - Robotic Fulfillment Line Simulation

A complete, production-ready simulation of a high-throughput event-driven architecture implementing a Kafka-like broker system managing a robotic fulfillment line. This system demonstrates partition routing, exactly-once processing, retry mechanisms, Dead-Letter Queue (DLQ) management, and network partition simulation.

![System Architecture](https://img.shields.io/badge/Architecture-Event--Driven-blue)
![Tech Stack](https://img.shields.io/badge/Stack-TypeScript%20%7C%20React%20%7C%20Node.js-green)
![Status](https://img.shields.io/badge/Status-Production--Ready-success)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [System Components](#-system-components)
- [API Endpoints](#-api-endpoints)
- [Key Features Deep Dive](#-key-features-deep-dive)
- [Testing Scenarios](#-testing-scenarios)
- [Project Structure](#-project-structure)
- [Enterprise Engineering Touches](#-enterprise-engineering-touches)

---

## ✨ Features

### Core Capabilities
- ✅ **4-Partition Mock Kafka Broker** with strict FIFO ordering per partition
- ✅ **Poison Message Routing** - Messages containing `:fail` are strictly routed to Partitions 0 or 1
- ✅ **Exactly-Once Processing** with explicit ACK/NACK protocol
- ✅ **Automatic Retry Mechanism** with configurable max retries (default: 3)
- ✅ **Dead-Letter Queue (DLQ)** for permanently failed messages
- ✅ **DLQ Management Console** with payload editing and resubmission
- ✅ **Offset #27 Poison Pill** - Engineered test case that fails exactly 3 times
- ✅ **Network Partition Simulation** with circuit breaker visualization
- ✅ **Real-time WebSocket Updates** for live dashboard monitoring
- ✅ **High-Throughput Metrics** simulating ~250,005 RPS
- ✅ **99.999% SLA Uptime** tracking and visualization
- ✅ **Comprehensive Logging Terminal** with color-coded log levels

### UI Components
- 🎨 **Beautiful Tailwind CSS Dashboard** with dark theme
- 📊 **Live Metrics Panel** showing RPS, uptime, and partition health
- 🔄 **Partition Lanes Visualization** with color-coded FIFO queues
- 🚨 **DLQ Dark Store Panel** with inline editing
- 🖥️ **Interactive Control Center** for message production and system control
- 📜 **Scrollable Logs Terminal** mimicking broker-level logging
- ⚡ **Smooth Animations** for message transitions and state changes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Metrics    │  │   Partition  │  │     DLQ      │         │
│  │    Panel     │  │    Lanes     │  │    Panel     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │ WebSocket + REST API
┌────────────────────────┴────────────────────────────────────────┐
│                   Backend (Node.js/Express)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              MockKafkaBroker Engine                       │  │
│  │  • 4 Partitions (FIFO queues)                            │  │
│  │  • Poison routing logic                                   │  │
│  │  • Offset tracking & commits                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              ConsumerWorker                               │  │
│  │  • Sequential processing per partition                    │  │
│  │  • ACK/NACK protocol                                      │  │
│  │  • Retry mechanism (max 3)                                │  │
│  │  • DLQ diversion on exhaustion                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              DLQManager                                   │  │
│  │  • Stores failed messages                                 │  │
│  │  • Payload editing                                        │  │
│  │  • Resubmission pipeline                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              MetricsSimulator                             │  │
│  │  • RPS simulation (~250k RPS)                             │  │
│  │  • Uptime tracking (99.999%)                              │  │
│  │  • Partition health monitoring                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **WebSocket:** ws library
- **Real-time:** Event-driven architecture with EventEmitter

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Hooks (useState, useCallback, useEffect)

---

## 📦 Prerequisites

- **Node.js:** v20.0.0 or higher
- **npm:** v10.0.0 or higher
- **Operating System:** Windows, macOS, or Linux

---

## 🚀 Installation

### 1. Clone or Navigate to the Project

```bash
cd kafka-broker-sim
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ▶️ Running the Application

### Option 1: Run Both Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
The backend server will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:3000`

### Option 2: Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

---

## 🧩 System Components

### 1. MockKafkaBroker
**File:** `backend/src/MockKafkaBroker.ts`

The core broker simulation implementing:
- Topic and partition management (4 partitions)
- Message production with offset tracking
- Strict poison message routing (`:fail` → Partition 0 or 1)
- Round-robin and key-hash partition selection
- Network partition simulation
- Comprehensive logging

### 2. ConsumerWorker
**File:** `backend/src/ConsumerWorker.ts`

Consumer group simulation with:
- Parallel partition consumers (1 per partition)
- Sequential FIFO processing per partition
- ACK/NACK protocol implementation
- Configurable retry budget (default: 3)
- Automatic DLQ diversion on exhaustion
- Offset #27 poison pill simulation

### 3. DLQManager
**File:** `backend/src/DLQManager.ts`

Dead-Letter Queue management:
- Failed message storage with metadata
- Error history tracking
- Payload modification interface
- Resubmission pipeline
- Status tracking (pending/resubmitted/archived)

### 4. MetricsSimulator
**File:** `backend/src/MetricsSimulator.ts`

Enterprise-grade metrics:
- Simulated RPS (~250,005 target)
- Real-time throughput calculation
- 99.999% SLA uptime tracking
- Partition health monitoring
- Message production/consumption counters

---

## 🔌 API Endpoints

### Message Production
```http
POST /api/messages/produce
Content-Type: application/json

{
  "payload": "order_fulfillment:item_123:pick_location_A1",
  "key": "optional_partition_key"
}
```

### Produce Poison Message
```http
POST /api/messages/produce-poison
Content-Type: application/json

{
  "itemId": "poison_item_99"
}
```

### Inject Offset #27 Poison Pill
```http
POST /api/messages/produce-offset27
```

### DLQ Operations

**Update Payload:**
```http
PATCH /api/dlq/:dlqId/payload
Content-Type: application/json

{
  "payload": "fixed_payload_without_fail_marker"
}
```

**Resubmit Message:**
```http
POST /api/dlq/:dlqId/resubmit
```

**Delete DLQ Entry:**
```http
DELETE /api/dlq/:dlqId
```

### Consumer Control
```http
POST /api/consumer/start
POST /api/consumer/stop
GET /api/consumer/status
```

### Network Simulation
```http
POST /api/network-partition
Content-Type: application/json

{
  "enabled": true,
  "affectedPartitions": [0, 1],
  "delayMs": 5000
}
```

### Monitoring
```http
GET /api/metrics
GET /api/logs?limit=100
DELETE /api/logs
GET /api/partitions
GET /api/dlq
```

---

## 🎯 Key Features Deep Dive

### Poison Message Routing

Messages containing the string `:fail` are **strictly routed** to Partitions 0 or 1 (randomly selected). This simulates a routing policy for problematic payloads.

```typescript
if (payload.includes(':fail')) {
  const poisonPartition = Math.random() < 0.5 ? 0 : 1;
  return poisonPartition; // Partition 0 or 1
}
```

### Exactly-Once Processing (EOP)

Each message is processed with:
1. **Sequential Processing** - One message at a time per partition
2. **Explicit ACK** - Successful processing commits the offset
3. **Explicit NACK** - Failed processing increments retry count
4. **Offset Commitment** - Only committed messages are removed from queue

### Retry Budget & DLQ Diversion

```
Attempt 1 → NACK (retryCount = 1)
Attempt 2 → NACK (retryCount = 2)
Attempt 3 → NACK (retryCount = 3)
Attempt 4 → retryCount > 3 → DLQ DIVERSION
```

### Offset #27 Engineered Poison Pill

A special test case where:
- Any message at **offset #27** will fail exactly 3 times
- On the 4th attempt, it gets diverted to the DLQ
- Highlighted in red on the UI for visibility

```typescript
if (message.offset === 27 && message.retryCount < MAX_RETRIES) {
  return { success: false, error: 'Engineered poison pill' };
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Normal Message Flow
1. Click "Produce Normal Message"
2. Watch the message appear in a partition lane
3. See the consumer process it (disappears after ~1.5s)
4. Check logs for ACK confirmation

### Scenario 2: Poison Message Handling
1. Click "Produce Poison Pill (:fail)"
2. Message routes to Partition 0 or 1
3. Watch retry attempts (1, 2, 3)
4. After 3 failures, message moves to DLQ Panel
5. Edit the payload (remove `:fail`)
6. Resubmit to reprocess successfully

### Scenario 3: Offset #27 Test Case
1. Click "Inject Offset #27 Poison Pill"
2. System ensures offset #27 exists (fills gaps if needed)
3. Watch the red "POISON #27" badge
4. See exactly 3 retry attempts
5. Message diverted to DLQ with special highlighting

### Scenario 4: Network Partition Simulation
1. Click "Simulate Network Partition"
2. Partitions 0 & 1 turn degraded (yellow health)
3. Messages stack up (circuit breaker engaged)
4. Click "Restore Network"
5. Processing resumes automatically

### Scenario 5: High-Throughput Load Test
1. Click "Produce Normal Message" rapidly (or use API)
2. Watch metrics panel update RPS in real-time
3. Monitor partition queue depths
4. Observe uptime percentage remain at 99.999%

---

## 📁 Project Structure

```
kafka-broker-sim/
├── backend/
│   ├── src/
│   │   ├── types.ts                 # TypeScript interfaces
│   │   ├── MockKafkaBroker.ts       # Core broker engine
│   │   ├── ConsumerWorker.ts        # Consumer simulation
│   │   ├── DLQManager.ts            # DLQ management
│   │   ├── MetricsSimulator.ts      # Metrics aggregation
│   │   └── index.ts                 # Express server + WebSocket
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetricsPanel.tsx     # Metrics visualization
│   │   │   ├── ControlPanel.tsx     # Control buttons
│   │   │   ├── PartitionLanes.tsx   # FIFO queue display
│   │   │   ├── DLQPanel.tsx         # DLQ management UI
│   │   │   └── LogsTerminal.tsx     # Broker logs
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts      # WebSocket hook
│   │   ├── services/
│   │   │   └── api.ts               # API client
│   │   ├── types.ts                 # Frontend types
│   │   ├── App.tsx                  # Main dashboard
│   │   ├── main.tsx                 # React entry
│   │   └── index.css                # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
└── README.md                        # This file
```

---

## 🌟 Enterprise Engineering Touches

### 1. High-Throughput Metrics Simulator
- Targets ~250,005 RPS with realistic variance (±2%)
- Degrades under simulated network issues (70% throughput)
- Real-time RPS calculation and display

### 2. 99.999% SLA Uptime Tracking
- Tracks system uptime since start
- Calculates availability based on partition health
- Displays formatted uptime (HH:MM:SS)

### 3. Network Partition Simulation
- **Circuit Breaker Pattern** implementation
- Simulates geo-replicated split-brain scenarios
- Bounded latency tolerance with visual alerts
- Affects Partitions 0 & 1 with 5000ms delay

### 4. Broker-Level Logging
- Color-coded log levels (INFO, WARN, ERROR, DEBUG)
- Timestamps with millisecond precision
- Auto-scrolling terminal with manual override
- Log rotation (keeps last 1000 entries)

### 5. Visual Design Excellence
- Dark theme optimized for 24/7 monitoring
- Partition-specific color coding
- Smooth animations for state transitions
- Responsive grid layouts for multi-monitor setups

---

## 🎓 Learning Outcomes

This simulation demonstrates:

1. **Event-Driven Architecture** - Decoupled components communicating via events
2. **Partition Management** - Strict FIFO ordering per partition
3. **Exactly-Once Semantics** - ACK/NACK protocol with offset tracking
4. **Retry Mechanisms** - Exponential backoff and budget exhaustion
5. **Dead-Letter Queues** - Isolating poison messages for manual intervention
6. **Circuit Breaker Pattern** - Graceful degradation under network issues
7. **Real-Time Monitoring** - WebSocket-based live dashboards
8. **High-Throughput Systems** - Simulating 250k+ RPS workloads

---

## 🐛 Troubleshooting

### Backend won't start
- Ensure Node.js 20+ is installed: `node --version`
- Check port 3001 is available
- Run `npm install` in backend directory

### Frontend won't connect
- Verify backend is running on port 3001
- Check browser console for WebSocket errors
- Ensure CORS is not blocking requests

### Messages not processing
- Check if consumer is active (green indicator)
- Look for circuit breaker alerts
- Review logs terminal for error messages

### WebSocket disconnects frequently
- Check network stability
- Look for firewall/proxy issues
- Backend logs will show connection attempts

---

## 📜 License

MIT License - Feel free to use this simulation for educational and commercial purposes.

---

## 👨‍💻 Author

Built by a **Principal Distributed Systems Engineer** specializing in:
- Event-Driven Architectures (Kafka, RabbitMQ, NATS)
- High-Throughput Systems (250k+ RPS)
- Microservices & Distributed Systems
- Full-Stack Development (TypeScript, React, Node.js)

---

## 🚀 Next Steps

1. **Install dependencies** for both backend and frontend
2. **Start both servers** (backend on 3001, frontend on 3000)
3. **Open the dashboard** at http://localhost:3000
4. **Run test scenarios** to see the system in action
5. **Monitor metrics** and logs in real-time
6. **Experiment** with poison messages and network partitions

---

**🎉 Enjoy your production-ready Kafka Broker simulation!**
