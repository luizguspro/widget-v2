const API_URL = '/api';

const api = {
  async criarWidget(dados) {
    const response = await fetch(`${API_URL}/widgets/criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    return response.json();
  },
  
  async buscarWidget(widgetId) {
    const response = await fetch(`${API_URL}/widgets/${widgetId}`);
    return response.json();
  },
  
  async atualizarWidget(widgetId, dados) {
    const response = await fetch(`${API_URL}/widgets/${widgetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    return response.json();
  }
};