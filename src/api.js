const API_BASE = '/api';

export const api = {
  async getDatabase() {
    const res = await fetch(`${API_BASE}/database`);
    if (!res.ok) throw new Error('Failed to fetch database');
    return res.json();
  },
  async saveDatabase(stateData) {
    const res = await fetch(`${API_BASE}/database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stateData)
    });
    if (!res.ok) throw new Error('Failed to save database');
    return res.json();
  },
  async savePDF(docType, filename, fileData) {
    const res = await fetch(`${API_BASE}/save-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType, filename, fileData })
    });
    if (!res.ok) throw new Error('Failed to save PDF');
    return res.json();
  }
};
