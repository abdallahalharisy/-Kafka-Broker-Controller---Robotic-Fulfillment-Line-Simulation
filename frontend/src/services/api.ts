const API_BASE = '/api';

export const api = {
  async produceMessage(payload: string, key?: string) {
    const response = await fetch(`${API_BASE}/messages/produce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, key })
    });
    return response.json();
  },

  async producePoisonMessage(itemId?: string) {
    const response = await fetch(`${API_BASE}/messages/produce-poison`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId })
    });
    return response.json();
  },

  async produceOffset27Message() {
    const response = await fetch(`${API_BASE}/messages/produce-offset27`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  async updateDLQPayload(dlqId: string, payload: string) {
    const response = await fetch(`${API_BASE}/dlq/${dlqId}/payload`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload })
    });
    return response.json();
  },

  async resubmitDLQMessage(dlqId: string) {
    const response = await fetch(`${API_BASE}/dlq/${dlqId}/resubmit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  async deleteDLQEntry(dlqId: string) {
    const response = await fetch(`${API_BASE}/dlq/${dlqId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async startConsumer() {
    const response = await fetch(`${API_BASE}/consumer/start`, {
      method: 'POST'
    });
    return response.json();
  },

  async stopConsumer() {
    const response = await fetch(`${API_BASE}/consumer/stop`, {
      method: 'POST'
    });
    return response.json();
  },

  async setNetworkPartition(enabled: boolean, affectedPartitions: number[], delayMs: number) {
    const response = await fetch(`${API_BASE}/network-partition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, affectedPartitions, delayMs })
    });
    return response.json();
  },

  async clearLogs() {
    const response = await fetch(`${API_BASE}/logs`, {
      method: 'DELETE'
    });
    return response.json();
  }
};
