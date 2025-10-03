import { Router, Request, Response } from 'express';
import dialogflowService from '../services/dialogflow.service';
import widgetService from '../services/widget.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const sessoes = new Map<string, { 
  sessionId: string; 
  timestamp: number;
  widgetId: string;
  timeoutMinutos?: number;
}>();

// Limpar sessões expiradas a cada minuto
setInterval(() => {
  const agora = Date.now();
  sessoes.forEach((sessao, sessionId) => {
    const timeout = (sessao.timeoutMinutos || 30) * 60 * 1000;
    if (agora - sessao.timestamp > timeout) {
      sessoes.delete(sessionId);
    }
  });
}, 60000);

router.get('/sessao/:widgetId', async (req: Request, res: Response) => {
  try {
    const widget = await widgetService.buscar(req.params.widgetId);
    if (!widget) {
      return res.status(404).json({ erro: 'Widget não encontrado' });
    }
    
    const sessionId = uuidv4();
    sessoes.set(sessionId, { 
      sessionId, 
      timestamp: Date.now(),
      widgetId: req.params.widgetId,
      timeoutMinutos: widget.recursos.timeoutHabilitado ? widget.recursos.timeoutMinutos : 30
    });
    
    res.json({ 
      sucesso: true, 
      sessionId,
      timeoutHabilitado: widget.recursos.timeoutHabilitado,
      timeoutMinutos: widget.recursos.timeoutMinutos 
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar sessão' });
  }
});

router.post('/mensagem', async (req: Request, res: Response) => {
  try {
    const { widgetId, sessionId, mensagem } = req.body;
    
    // Validar sessão
    const sessao = sessoes.get(sessionId);
    if (!sessao) {
      return res.status(401).json({ 
        erro: 'Sessão expirada', 
        tipo: 'timeout',
        reiniciar: true 
      });
    }
    
    const widget = await widgetService.buscar(widgetId);
    if (!widget) {
      return res.status(404).json({ erro: 'Widget não encontrado' });
    }
    
    // Verificar timeout personalizado
    const timeoutMs = (widget.recursos.timeoutMinutos || 30) * 60 * 1000;
    if (Date.now() - sessao.timestamp > timeoutMs) {
      sessoes.delete(sessionId);
      return res.status(401).json({ 
        erro: 'Sessão expirada por inatividade',
        tipo: 'timeout',
        reiniciar: true,
        mensagem: widget.mensagens.timeoutReinicio
      });
    }
    
    // Processar mensagem com Dialogflow
    const resposta = await dialogflowService.processarMensagem(
      widget.dialogflow,
      sessionId,
      mensagem
    );
    
    // Atualizar timestamp da sessão
    sessao.timestamp = Date.now();
    
    res.json({ sucesso: true, resposta });
  } catch (erro) {
    console.error('Erro ao processar mensagem:', erro);
    res.status(500).json({ erro: 'Erro ao processar mensagem' });
  }
});

router.post('/reiniciar/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessao = sessoes.get(req.params.sessionId);
    if (sessao) {
      sessao.timestamp = Date.now();
      res.json({ sucesso: true, mensagem: 'Sessão reiniciada' });
    } else {
      res.status(404).json({ erro: 'Sessão não encontrada' });
    }
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao reiniciar sessão' });
  }
});

export default router;