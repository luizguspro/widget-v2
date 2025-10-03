import clienteDialogflow from '../config/dialogflow.config';
import { protos } from '@google-cloud/dialogflow';

type DetectIntentResponse = protos.google.cloud.dialogflow.v2.IDetectIntentResponse;

class DialogflowService {
  
  async iniciarConversa(config: any, sessionId: string): Promise<any> {
    console.log('[DIALOGFLOW] Iniciando conversa...');
    console.log('[DIALOGFLOW] Config:', config);
    
    try {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log('[DIALOGFLOW] Sem credenciais - usando mensagem padrão');
        return null;
      }
      
      const sessionPath = clienteDialogflow.projectAgentSessionPath(
        config.projectId,
        sessionId
      );
      
      console.log('[DIALOGFLOW] Session path:', sessionPath);
      
      try {
        // Tentar com "oi"
        const requisicao = {
          session: sessionPath,
          queryInput: {
            text: {
              text: 'oi',
              languageCode: 'pt-BR'
            }
          }
        };
        
        const [resposta] = await clienteDialogflow.detectIntent(requisicao);
        console.log('[DIALOGFLOW] Resposta recebida!');
        return this.formatarResposta(resposta as DetectIntentResponse);
        
      } catch (erro: any) {
        console.log('[DIALOGFLOW] Erro:', erro?.message || 'Erro desconhecido');
        return null;
      }
      
    } catch (erro: any) {
      console.error('[DIALOGFLOW] Erro geral:', erro?.message || 'Erro desconhecido');
      return null;
    }
  }
  
  async processarMensagem(config: any, sessionId: string, texto: string): Promise<any> {
    try {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return {
          texto: 'Bot de teste: ' + texto,
          tipo: 'texto',
          dados: null
        };
      }
      
      const sessionPath = clienteDialogflow.projectAgentSessionPath(
        config.projectId,
        sessionId
      );
      
      const requisicao = {
        session: sessionPath,
        queryInput: {
          text: {
            text: texto,
            languageCode: 'pt-BR'
          }
        }
      };
      
      const [resposta] = await clienteDialogflow.detectIntent(requisicao);
      return this.formatarResposta(resposta as DetectIntentResponse);
      
    } catch (erro: any) {
      console.error('[DIALOGFLOW] Erro:', erro?.message || 'Erro desconhecido');
      return {
        texto: 'Desculpe, ocorreu um erro.',
        tipo: 'erro',
        dados: null
      };
    }
  }
  
  private formatarResposta(resposta: DetectIntentResponse): any {
    const queryResult = resposta.queryResult;
    
    if (!queryResult) {
      return {
        texto: 'Sem resposta do Dialogflow',
        tipo: 'erro',
        dados: null
      };
    }
    
    console.log('[DIALOGFLOW] Intent:', queryResult.intent?.displayName);
    console.log('[DIALOGFLOW] Fulfillment:', queryResult.fulfillmentText);
    
    // Juntar todas as mensagens de texto
    const textos: string[] = [];
    
    if (queryResult.fulfillmentText) {
      textos.push(queryResult.fulfillmentText);
    }
    
    if (queryResult.fulfillmentMessages) {
      queryResult.fulfillmentMessages.forEach(msg => {
        if (msg.text && msg.text.text) {
          textos.push(...msg.text.text);
        }
      });
    }
    
    return {
      texto: textos.join('\n\n') || 'Sem resposta',
      tipo: 'texto',
      dados: null
    };
  }
}

export default new DialogflowService();