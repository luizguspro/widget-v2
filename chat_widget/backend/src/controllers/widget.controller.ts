import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import widgetService from '../services/widget.service';

const router = Router();

router.post('/criar', async (req: Request, res: Response) => {
  try {
    const widgetId = uuidv4();
    const novoWidget = {
      widgetId,
      ...req.body,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    const widget = await widgetService.criar(novoWidget);
    res.status(201).json({ sucesso: true, widget });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar widget' });
  }
});

router.get('/:widgetId', async (req: Request, res: Response) => {
  try {
    const widget = await widgetService.buscar(req.params.widgetId);
    if (!widget) {
      return res.status(404).json({ erro: 'Widget não encontrado' });
    }
    res.json({ sucesso: true, widget });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar widget' });
  }
});

router.put('/:widgetId', async (req: Request, res: Response) => {
  try {
    const widget = await widgetService.atualizar(req.params.widgetId, req.body);
    if (!widget) {
      return res.status(404).json({ erro: 'Widget não encontrado' });
    }
    res.json({ sucesso: true, widget });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar widget' });
  }
});

export default router;