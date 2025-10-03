import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import widgetRoutes from './controllers/widget.controller';
import chatRoutes from './controllers/chat.controller';
import { corsMiddleware, widgetCorsMiddleware } from './middleware/cors.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Aumentar limite do payload para 10MB (para imagens base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS geral para admin
app.use('/admin', corsMiddleware);
app.use('/admin', express.static(path.join(__dirname, '../../frontend-admin')));

// CORS permissivo para widget e API do chat
app.use('/widget', widgetCorsMiddleware);
app.use('/widget', express.static(path.join(__dirname, '../../widget')));

app.use('/api/widgets', widgetCorsMiddleware);
app.use('/api/chat', widgetCorsMiddleware);

// Rotas da API
app.use('/api/widgets', widgetRoutes);
app.use('/api/chat', chatRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    mensagem: 'Chat Widget API',
    admin: '/admin',
    widget: '/widget',
    documentacao: '/api/docs'
  });
});

app.listen(PORT, () => {
  console.log(`====================================`);
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
  console.log(`====================================`);
  console.log(``);
  console.log(`Para testar o widget em sites externos:`);
  console.log(`1. Crie um widget no admin`);
  console.log(`2. Copie o código de embed`);
  console.log(`3. Cole em qualquer site HTML`);
  console.log(`====================================`);
});