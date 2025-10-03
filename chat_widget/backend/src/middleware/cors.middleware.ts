import cors from 'cors';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Para produção, você deve listar domínios específicos
    // Por enquanto, aceitar qualquer origem para testes
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Widget-Id'],
  exposedHeaders: ['Content-Type']
});

// Middleware específico para rotas do widget - mais permissivo
export const widgetCorsMiddleware = cors({
  origin: true, // Aceita qualquer origem
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Widget-Id'],
  exposedHeaders: ['Content-Type']
});