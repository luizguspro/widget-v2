import fs from 'fs';
import path from 'path';
import { WidgetConfig } from '../types/widget.types';

const caminhoArquivo = path.join(__dirname, '../data/widgets.json');

class WidgetService {
  private widgets: Map<string, WidgetConfig> = new Map();
  
  constructor() {
    this.carregarWidgets();
  }
  
  private carregarWidgets() {
    try {
      if (fs.existsSync(caminhoArquivo)) {
        const dados = fs.readFileSync(caminhoArquivo, 'utf-8');
        const widgets = JSON.parse(dados);
        widgets.forEach((w: WidgetConfig) => this.widgets.set(w.widgetId, w));
      }
    } catch (erro) {
      console.error('Erro ao carregar widgets:', erro);
    }
  }
  
  private salvarWidgets() {
    try {
      const widgets = Array.from(this.widgets.values());
      fs.writeFileSync(caminhoArquivo, JSON.stringify(widgets, null, 2));
    } catch (erro) {
      console.error('Erro ao salvar widgets:', erro);
    }
  }
  
  async criar(widget: WidgetConfig): Promise<WidgetConfig> {
    this.widgets.set(widget.widgetId, widget);
    this.salvarWidgets();
    return widget;
  }
  
  async buscar(widgetId: string): Promise<WidgetConfig | undefined> {
    return this.widgets.get(widgetId);
  }
  
  async atualizar(widgetId: string, dados: Partial<WidgetConfig>): Promise<WidgetConfig | undefined> {
    const widget = this.widgets.get(widgetId);
    if (!widget) return undefined;
    
    const widgetAtualizado = {
      ...widget,
      ...dados,
      widgetId,
      atualizadoEm: new Date()
    };
    
    this.widgets.set(widgetId, widgetAtualizado);
    this.salvarWidgets();
    return widgetAtualizado;
  }
}

export default new WidgetService();