export interface WidgetConfig {
  widgetId: string;
  cliente: string;
  dominioAutorizado: string;
  dialogflow: {
    agentId: string;
    projectId: string;
    location: string;
  };
  visual: {
    corPrimaria: string;
    corSecundaria: string;
    posicao: 'bottom-right' | 'bottom-left';
    largura: number;
    altura: number;
    imagemPerfil: string; // URL ou base64 da imagem
    nomeBotVisivel: string; // Nome do bot no header
  };
  mensagens: {
    boasVindas: string;
    placeholder: string;
    offline: string;
    timeoutAviso: string; // Mensagem antes do timeout
    timeoutReinicio: string; // Mensagem ao reiniciar por timeout
  };
  recursos: {
    upload: boolean;
    botoesRapidos: string[];
    som: boolean;
    historico: boolean;
    mostrarRefresh: boolean; // Mostrar botão refresh
    timeoutHabilitado: boolean; // Habilitar timeout
    timeoutMinutos: number; // Tempo em minutos para timeout
  };
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ChatMessage {
  texto: string;
  remetente: 'user' | 'bot';
  timestamp: Date;
  sessionId?: string;
}