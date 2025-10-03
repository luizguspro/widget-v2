// backend/src/services/dialogflow.service.ts
import { SessionsClient } from '@google-cloud/dialogflow-cx';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

class DialogflowService {
  private clientsCache: Map<string, SessionsClient> = new Map();
  
  constructor() {
    console.log('[DIALOGFLOW] Service inicializado (multi-tenant)');
  }
  
  // Cria ou retorna cliente específico para cada configuração
  private getClient(config: any): SessionsClient | null {
    try {
      // SEMPRE usa o arquivo local, ignora variável de ambiente
      const fs = require('fs');
      const path = require('path');
      
      // Tenta vários caminhos até achar o arquivo
      const possiveisCaminhos = [
        path.join(process.cwd(), 'service-account.json'),
        path.join(__dirname, 'service-account.json'),
        path.join(__dirname, '..', 'service-account.json'),
        path.join(__dirname, '../..', 'service-account.json'),
        './service-account.json'
      ];
      
      let credentialsPath = null;
      for (const caminho of possiveisCaminhos) {
        if (fs.existsSync(caminho)) {
          credentialsPath = caminho;
          console.log('[DIALOGFLOW] Credenciais encontradas em:', caminho);
          break;
        }
      }
      
      if (!credentialsPath) {
        console.warn('[DIALOGFLOW] Sem credenciais - modo teste');
        return null;
      }
      
      // Chave única para cache baseada na configuração
      const cacheKey = `${config.projectId}-${config.location}-${config.agentId}`;
      
      // Verifica cache
      if (this.clientsCache.has(cacheKey)) {
        return this.clientsCache.get(cacheKey)!;
      }
      
      // Determina o endpoint baseado na location
      let apiEndpoint = 'dialogflow.googleapis.com'; // default para global
      
      if (config.location && config.location !== 'global') {
        // Para regiões específicas
        apiEndpoint = `${config.location}-dialogflow.googleapis.com`;
      }
      
      console.log(`[DIALOGFLOW] Criando cliente para ${config.location} (${apiEndpoint})`);
      
      // Cria novo cliente
      const client = new SessionsClient({
        keyFilename: credentialsPath,
        apiEndpoint: apiEndpoint
      });
      
      // Salva no cache
      this.clientsCache.set(cacheKey, client);
      
      return client;
    } catch (erro: any) {
      console.error('[DIALOGFLOW] Erro ao criar cliente:', erro.message);
      return null;
    }
  }
  
  private getSessionPath(client: SessionsClient, config: any, sessionId: string): string {
    return client.projectLocationAgentSessionPath(
      config.projectId,
      config.location || 'global',
      config.agentId,
      sessionId
    );
  }
  
  async iniciarConversa(config: any, sessionId: string): Promise<any> {
    const client = this.getClient(config);
    
    if (!client) {
      console.log('[DIALOGFLOW] Sem cliente - retornando null');
      return null;
    }
    
    try {
      const sessionPath = this.getSessionPath(client, config, sessionId);
      
      // Determina o language code baseado na location
      const languageCode = config.location === 'global' ? 'pt-br' : 'pt-BR';
      
      const request = {
        session: sessionPath,
        queryInput: {
          event: {
            event: 'WELCOME'
          },
          languageCode: languageCode
        }
      };
      
      console.log(`[DIALOGFLOW] Iniciando conversa com agente ${config.agentId}`);
      
      const [response] = await client.detectIntent(request);
      const resultado = this.formatarResposta(response);
      
      if (resultado && resultado.texto) {
        console.log('[DIALOGFLOW] Mensagem inicial recebida do Dialogflow');
        return resultado;
      }
      
      return null;
      
    } catch (erro: any) {
      console.error('[DIALOGFLOW] Erro ao iniciar:', erro.message);
      return null;
    }
  }
  
  async processarMensagem(config: any, sessionId: string, texto: string): Promise<any> {
    const client = this.getClient(config);
    
    if (!client) {
      console.log('[DIALOGFLOW] Modo teste ativo');
      return {
        texto: `[Modo Teste] Você disse: "${texto}"\n\nPara funcionar com o Dialogflow, adicione o arquivo service-account.json`,
        tipo: 'texto',
        dados: null
      };
    }
    
    try {
      const sessionPath = this.getSessionPath(client, config, sessionId);
      const languageCode = config.location === 'global' ? 'pt-br' : 'pt-BR';
      
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: texto
          },
          languageCode: languageCode
        }
      };
      
      console.log(`[DIALOGFLOW] Processando: "${texto}" para agente ${config.agentId}`);
      
      const [response] = await client.detectIntent(request);
      const resultado = this.formatarResposta(response);
      
      return resultado;
      
    } catch (erro: any) {
      console.error('[DIALOGFLOW] Erro:', erro.message);
      
      if (erro.code === 7 || erro.code === 16) {
        return {
          texto: '⚠️ Erro de autenticação. Verifique o arquivo service-account.json',
          tipo: 'erro',
          dados: null
        };
      }
      
      if (erro.code === 5) {
        return {
          texto: '⚠️ Agente não encontrado. Verifique o Agent ID e a região.',
          tipo: 'erro',
          dados: null
        };
      }
      
      return {
        texto: 'Desculpe, ocorreu um erro. Tente novamente.',
        tipo: 'erro',
        dados: null
      };
    }
  }
  
  private formatarResposta(response: any): any {
    const queryResult = response?.queryResult;
    
    if (!queryResult) {
      return {
        texto: 'Sem resposta',
        tipo: 'erro',
        dados: null
      };
    }
    
    const mensagens: string[] = [];
    
    if (queryResult.responseMessages) {
      queryResult.responseMessages.forEach((msg: any) => {
        if (msg.text?.text) {
          mensagens.push(...msg.text.text);
        }
        
        if (msg.payload?.richContent) {
          console.log('[DIALOGFLOW] Rich content detectado');
        }
        
        if (msg.liveAgentHandoff) {
          mensagens.push('🤝 Transferindo para um atendente...');
        }
      });
    }
    
    const dados = {
      intent: queryResult.match?.intent?.displayName || null,
      confidence: queryResult.match?.confidence || null,
      parameters: queryResult.parameters?.fields || {},
      currentPage: queryResult.currentPage?.displayName || null
    };
    
    return {
      texto: mensagens.join('\n\n') || 'Desculpe, não entendi.',
      tipo: 'texto',
      dados: dados
    };
  }
  
  // Limpar cache se necessário
  limparCache() {
    this.clientsCache.clear();
    console.log('[DIALOGFLOW] Cache de clientes limpo');
  }
}

export default new DialogflowService();