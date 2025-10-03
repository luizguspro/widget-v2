const fs = require('fs');
const path = require('path');

console.log('====================================');
console.log('  ATUALIZANDO CHAT WIDGET           ');
console.log('====================================\n');

// Atualizar widget.types.ts com novos campos
const widgetTypesContent = `export interface WidgetConfig {
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
}`;

// Atualizar chat.controller.ts com timeout
const chatControllerContent = `import { Router, Request, Response } from 'express';
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

export default router;`;

// Atualizar index.html do admin com upload de imagem
const adminHtmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configurador de Chat Widget</title>
  <link rel="stylesheet" href="css/admin.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>Configurador de Chat Widget</h1>
      <p>Configure seu chat integrado com Dialogflow CX</p>
    </header>
    
    <div class="content">
      <div class="configurador">
        <form id="formWidget">
          <section class="secao">
            <h2>Identificação</h2>
            <div class="campo">
              <label for="cliente">Nome do Cliente</label>
              <input type="text" id="cliente" required>
            </div>
            <div class="campo">
              <label for="dominio">Domínio Autorizado</label>
              <input type="text" id="dominio" placeholder="exemplo.com.br" required>
            </div>
          </section>
          
          <section class="secao">
            <h2>Perfil do Bot</h2>
            <div class="campo">
              <label for="nomeBotVisivel">Nome do Bot</label>
              <input type="text" id="nomeBotVisivel" placeholder="Assistente Virtual" value="Assistente">
            </div>
            <div class="campo">
              <label for="imagemPerfil">Imagem de Perfil do Bot</label>
              <div class="upload-area">
                <input type="file" id="imagemPerfil" accept="image/*" style="display:none;">
                <div class="upload-preview" id="uploadPreview">
                  <img id="previewImg" style="display:none;">
                  <div id="uploadPlaceholder">
                    <svg width="40" height="40" fill="#999">
                      <path d="M20 4C11.16 4 4 11.16 4 20s7.16 16 16 16 16-7.16 16-16S28.84 4 20 4zm0 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 20c-4.42 0-8.31-2.27-10.58-5.7C11.7 23.94 15.85 22.5 20 22.5s8.3 1.44 10.58 3.8C28.31 29.73 24.42 32 20 32z"/>
                    </svg>
                    <p>Clique para adicionar foto</p>
                    <small>Recomendado: 100x100px, formato quadrado</small>
                  </div>
                </div>
                <button type="button" id="btnUpload" class="btn-upload">Escolher Imagem</button>
                <button type="button" id="btnRemover" class="btn-remover" style="display:none;">Remover</button>
              </div>
            </div>
          </section>
          
          <section class="secao">
            <h2>Dialogflow</h2>
            <div class="campo">
              <label for="agentId">Agent ID</label>
              <input type="text" id="agentId" required>
            </div>
            <div class="campo">
              <label for="projectId">Project ID</label>
              <input type="text" id="projectId" required>
            </div>
            <div class="campo">
              <label for="location">Região</label>
              <select id="location" required>
                <option value="southamerica-east1">São Paulo (southamerica-east1)</option>
                <option value="us-central1">US Central</option>
                <option value="europe-west1">Europa</option>
              </select>
            </div>
          </section>
          
          <section class="secao">
            <h2>Visual</h2>
            <div class="grupo-campos">
              <div class="campo">
                <label for="corPrimaria">Cor Primária</label>
                <input type="color" id="corPrimaria" value="#4285f4">
              </div>
              <div class="campo">
                <label for="corSecundaria">Cor Secundária</label>
                <input type="color" id="corSecundaria" value="#f0f0f0">
              </div>
            </div>
            <div class="campo">
              <label for="posicao">Posição</label>
              <select id="posicao">
                <option value="bottom-right">Inferior Direita</option>
                <option value="bottom-left">Inferior Esquerda</option>
              </select>
            </div>
            <div class="grupo-campos">
              <div class="campo">
                <label for="largura">Largura (px)</label>
                <input type="number" id="largura" value="350" min="300" max="500">
              </div>
              <div class="campo">
                <label for="altura">Altura (px)</label>
                <input type="number" id="altura" value="500" min="400" max="700">
              </div>
            </div>
          </section>
          
          <section class="secao">
            <h2>Mensagens</h2>
            <div class="campo">
              <label for="boasVindas">Mensagem de Boas-vindas</label>
              <textarea id="boasVindas" rows="2">Olá! Como posso ajudar você hoje?</textarea>
            </div>
            <div class="campo">
              <label for="placeholder">Placeholder do Input</label>
              <input type="text" id="placeholder" value="Digite sua mensagem...">
            </div>
            <div class="campo">
              <label for="offline">Mensagem Offline</label>
              <input type="text" id="offline" value="No momento estamos offline">
            </div>
            <div class="campo">
              <label for="timeoutAviso">Aviso de Timeout (opcional)</label>
              <input type="text" id="timeoutAviso" value="Você ainda está aí? A conversa será reiniciada em breve por inatividade.">
            </div>
            <div class="campo">
              <label for="timeoutReinicio">Mensagem ao Reiniciar por Timeout</label>
              <input type="text" id="timeoutReinicio" value="A conversa foi reiniciada devido à inatividade. Como posso ajudar?">
            </div>
          </section>
          
          <section class="secao">
            <h2>Recursos</h2>
            <div class="campo-checkbox">
              <input type="checkbox" id="upload" checked>
              <label for="upload">Habilitar upload de arquivos</label>
            </div>
            <div class="campo-checkbox">
              <input type="checkbox" id="som" checked>
              <label for="som">Sons de notificação</label>
            </div>
            <div class="campo-checkbox">
              <input type="checkbox" id="historico" checked>
              <label for="historico">Manter histórico</label>
            </div>
            <div class="campo-checkbox">
              <input type="checkbox" id="mostrarRefresh" checked>
              <label for="mostrarRefresh">Mostrar botão de refresh</label>
            </div>
            <div class="campo-checkbox">
              <input type="checkbox" id="timeoutHabilitado" checked>
              <label for="timeoutHabilitado">Habilitar timeout de inatividade</label>
            </div>
            <div class="campo" id="campoTimeout">
              <label for="timeoutMinutos">Tempo de inatividade (minutos)</label>
              <input type="number" id="timeoutMinutos" value="5" min="1" max="60">
              <small>Após este tempo sem interação, a conversa será reiniciada</small>
            </div>
            <div class="campo">
              <label>Botões Rápidos (um por linha)</label>
              <textarea id="botoesRapidos" rows="3">Ajuda
Falar com atendente
Preços</textarea>
            </div>
          </section>
          
          <button type="submit" class="btn-gerar">Gerar Widget</button>
        </form>
      </div>
      
      <div class="preview-container">
        <h2>Preview</h2>
        <div id="preview">
          <iframe src="about:blank" id="previewFrame"></iframe>
        </div>
        
        <div id="codigoEmbed" class="codigo-embed" style="display:none;">
          <h3>Código para Embed</h3>
          <pre><code id="codigo"></code></pre>
          <button class="btn-copiar" onclick="copiarCodigo()">Copiar Código</button>
        </div>
      </div>
    </div>
  </div>
  
  <script src="js/api.js"></script>
  <script src="js/configurador.js"></script>
  <script src="js/preview.js"></script>
  <script src="js/upload.js"></script>
</body>
</html>`;

// Criar novo arquivo upload.js
const uploadJsContent = `// Gerenciamento de upload de imagem
let imagemBase64 = '';

document.addEventListener('DOMContentLoaded', function() {
  const inputFile = document.getElementById('imagemPerfil');
  const btnUpload = document.getElementById('btnUpload');
  const btnRemover = document.getElementById('btnRemover');
  const previewImg = document.getElementById('previewImg');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const uploadPreview = document.getElementById('uploadPreview');
  const checkTimeout = document.getElementById('timeoutHabilitado');
  const campoTimeout = document.getElementById('campoTimeout');
  
  // Controle de visibilidade do campo de timeout
  checkTimeout.addEventListener('change', function() {
    campoTimeout.style.display = this.checked ? 'block' : 'none';
  });
  
  // Clique na área de preview
  uploadPreview.addEventListener('click', function() {
    if (!previewImg.src || previewImg.style.display === 'none') {
      inputFile.click();
    }
  });
  
  // Clique no botão de upload
  btnUpload.addEventListener('click', function() {
    inputFile.click();
  });
  
  // Remover imagem
  btnRemover.addEventListener('click', function() {
    imagemBase64 = '';
    previewImg.src = '';
    previewImg.style.display = 'none';
    uploadPlaceholder.style.display = 'block';
    btnRemover.style.display = 'none';
    inputFile.value = '';
    atualizarPreviewLocal();
  });
  
  // Processar arquivo selecionado
  inputFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        imagemBase64 = e.target.result;
        previewImg.src = imagemBase64;
        previewImg.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        btnRemover.style.display = 'inline-block';
        atualizarPreviewLocal();
      };
      
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, selecione um arquivo de imagem válido');
    }
  });
});

// Exportar imagem para uso no configurador
function getImagemPerfil() {
  return imagemBase64 || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iIzk5OSI+PHBhdGggZD0iTTIwIDRDMTEuMTYgNCA0IDExLjE2IDQgMjBzNy4xNiAxNiAxNiAxNiAxNi03LjE2IDE2LTE2UzI4Ljg0IDQgMjAgNHptMCA4YzIuMjEgMCA0IDEuNzkgNCA0cy0xLjc5IDQtNCA0LTQtMS43OS00LTQgMS43OS00IDQtNHptMCAyMGMtNC40MiAwLTguMzEtMi4yNy0xMC41OC01LjdDMTEuNyAyMy45NCAxNS44NSAyMi41IDIwIDIyLjVzOC4zIDEuNDQgMTAuNTggMy44QzI4LjMxIDI5LjczIDI0LjQyIDMyIDIwIDMyek0yMCA0QzExLjE2IDQgNCAxMS4xNiA0IDIwczcuMTYgMTYgMTYgMTYgMTYtNy4xNiAxNi0xNlMyOC44NCA0IDIwIDR6bTAgOGMyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6bTAgMjBjLTQuNDIgMC04LjMxLTIuMjctMTAuNTgtNS43QzExLjcgMjMuOTQgMTUuODUgMjIuNSAyMCAyMi41czguMyAxLjQ0IDEwLjU4IDMuOEMyOC4zMSAyOS43MyAyNC40MiAzMiAyMCAzMnoiLz48L3N2Zz4=';
}`;

// Atualizar admin.css com estilos para upload
const adminCssUpdate = `/* Adicionar ao final do admin.css existente */

.upload-area {
  margin-top: 10px;
}

.upload-preview {
  width: 100px;
  height: 100px;
  border: 2px dashed #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 10px;
  overflow: hidden;
  transition: border-color 0.3s;
}

.upload-preview:hover {
  border-color: #667eea;
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#uploadPlaceholder {
  text-align: center;
  color: #999;
}

#uploadPlaceholder svg {
  margin-bottom: 5px;
}

#uploadPlaceholder p {
  margin: 5px 0;
  font-size: 12px;
}

#uploadPlaceholder small {
  font-size: 10px;
  display: block;
}

.btn-upload, .btn-remover {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
}

.btn-upload {
  background: #667eea;
  color: white;
}

.btn-remover {
  background: #dc3545;
  color: white;
}

#campoTimeout {
  margin-left: 25px;
  margin-top: 10px;
}

#campoTimeout small {
  display: block;
  color: #666;
  font-size: 12px;
  margin-top: 5px;
}`;

// Atualizar configurador.js
const configuradorJsUpdate = `let widgetIdAtual = null;

document.getElementById('formWidget').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const dados = {
    cliente: document.getElementById('cliente').value,
    dominioAutorizado: document.getElementById('dominio').value,
    dialogflow: {
      agentId: document.getElementById('agentId').value,
      projectId: document.getElementById('projectId').value,
      location: document.getElementById('location').value
    },
    visual: {
      corPrimaria: document.getElementById('corPrimaria').value,
      corSecundaria: document.getElementById('corSecundaria').value,
      posicao: document.getElementById('posicao').value,
      largura: parseInt(document.getElementById('largura').value),
      altura: parseInt(document.getElementById('altura').value),
      imagemPerfil: getImagemPerfil(), // Função do upload.js
      nomeBotVisivel: document.getElementById('nomeBotVisivel').value
    },
    mensagens: {
      boasVindas: document.getElementById('boasVindas').value,
      placeholder: document.getElementById('placeholder').value,
      offline: document.getElementById('offline').value,
      timeoutAviso: document.getElementById('timeoutAviso').value,
      timeoutReinicio: document.getElementById('timeoutReinicio').value
    },
    recursos: {
      upload: document.getElementById('upload').checked,
      botoesRapidos: document.getElementById('botoesRapidos').value.split('\\n').filter(b => b.trim()),
      som: document.getElementById('som').checked,
      historico: document.getElementById('historico').checked,
      mostrarRefresh: document.getElementById('mostrarRefresh').checked,
      timeoutHabilitado: document.getElementById('timeoutHabilitado').checked,
      timeoutMinutos: parseInt(document.getElementById('timeoutMinutos').value)
    }
  };
  
  try {
    const resultado = await api.criarWidget(dados);
    if (resultado.sucesso) {
      widgetIdAtual = resultado.widget.widgetId;
      mostrarCodigoEmbed(widgetIdAtual);
      atualizarPreview(resultado.widget);
      alert('Widget criado com sucesso!');
    }
  } catch (erro) {
    alert('Erro ao criar widget');
    console.error(erro);
  }
});

function mostrarCodigoEmbed(widgetId) {
  const codigo = \`<script src="\${window.location.origin}/widget/widget.js"></script>
<script>
  ChatWidget.inicializar({
    widgetId: '\${widgetId}'
  });
</script>\`;
  
  document.getElementById('codigo').textContent = codigo;
  document.getElementById('codigoEmbed').style.display = 'block';
}

function copiarCodigo() {
  const codigo = document.getElementById('codigo').textContent;
  navigator.clipboard.writeText(codigo).then(() => {
    alert('Código copiado!');
  });
}

// Atualizar preview em tempo real
document.querySelectorAll('input, select, textarea').forEach(campo => {
  campo.addEventListener('input', () => {
    if (widgetIdAtual) {
      atualizarPreviewLocal();
    }
  });
});`;

// Atualizar widget.js com novas funcionalidades
const widgetJsUpdate = `(function() {
  const ChatWidget = {
    config: null,
    sessionId: null,
    isOpen: false,
    container: null,
    timeoutTimer: null,
    avisoTimer: null,
    ultimaAtividade: Date.now(),
    
    async inicializar(opcoes) {
      if (!opcoes.widgetId) {
        console.error('Widget ID é obrigatório');
        return;
      }
      
      // Buscar configuração
      try {
        const response = await fetch(\`/api/widgets/\${opcoes.widgetId}\`);
        const data = await response.json();
        
        if (!data.sucesso) {
          console.error('Widget não encontrado');
          return;
        }
        
        this.config = data.widget;
        this.criarWidget();
        this.iniciarSessao();
        this.configurarTimeout();
      } catch (erro) {
        console.error('Erro ao inicializar widget:', erro);
      }
    },
    
    async iniciarSessao() {
      try {
        const response = await fetch(\`/api/chat/sessao/\${this.config.widgetId}\`);
        const data = await response.json();
        this.sessionId = data.sessionId;
      } catch (erro) {
        console.error('Erro ao iniciar sessão:', erro);
      }
    },
    
    configurarTimeout() {
      if (!this.config.recursos.timeoutHabilitado) return;
      
      const timeoutMs = this.config.recursos.timeoutMinutos * 60 * 1000;
      const avisoMs = Math.max(timeoutMs - 60000, timeoutMs * 0.8); // Aviso 1 min antes ou 80% do tempo
      
      // Resetar timers
      this.resetarTimeout();
      
      // Monitorar atividade
      document.addEventListener('mousemove', () => this.registrarAtividade());
      document.addEventListener('keypress', () => this.registrarAtividade());
    },
    
    registrarAtividade() {
      this.ultimaAtividade = Date.now();
      this.resetarTimeout();
    },
    
    resetarTimeout() {
      if (!this.config.recursos.timeoutHabilitado) return;
      
      clearTimeout(this.timeoutTimer);
      clearTimeout(this.avisoTimer);
      
      const timeoutMs = this.config.recursos.timeoutMinutos * 60 * 1000;
      const avisoMs = Math.max(timeoutMs - 60000, timeoutMs * 0.8);
      
      // Aviso antes do timeout
      this.avisoTimer = setTimeout(() => {
        if (this.isOpen) {
          this.adicionarMensagem(this.config.mensagens.timeoutAviso, 'sistema');
        }
      }, avisoMs);
      
      // Timeout final
      this.timeoutTimer = setTimeout(() => {
        this.reiniciarPorTimeout();
      }, timeoutMs);
    },
    
    async reiniciarPorTimeout() {
      if (!this.isOpen) return;
      
      // Limpar mensagens
      const container = document.getElementById('chatMensagens');
      container.innerHTML = '';
      
      // Nova sessão
      await this.iniciarSessao();
      
      // Mensagem de reinício
      this.adicionarMensagem(this.config.mensagens.timeoutReinicio, 'bot');
      
      // Resetar timers
      this.resetarTimeout();
    },
    
    async reiniciarConversa() {
      const container = document.getElementById('chatMensagens');
      container.innerHTML = '';
      
      await this.iniciarSessao();
      
      if (this.config.mensagens.boasVindas) {
        this.adicionarMensagem(this.config.mensagens.boasVindas, 'bot');
      }
      
      this.resetarTimeout();
    },
    
    criarWidget() {
      // Criar container
      this.container = document.createElement('div');
      this.container.id = 'chat-widget-container';
      this.container.innerHTML = this.gerarHTML();
      document.body.appendChild(this.container);
      
      // Adicionar estilos
      const style = document.createElement('style');
      style.textContent = this.gerarCSS();
      document.head.appendChild(style);
      
      // Adicionar event listeners
      this.configurarEventos();
      
      // Mostrar mensagem de boas-vindas
      if (this.config.mensagens.boasVindas) {
        this.adicionarMensagem(this.config.mensagens.boasVindas, 'bot');
      }
    },
    
    gerarHTML() {
      const imagemPerfil = this.config.visual.imagemPerfil || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IndoaXRlIj48cGF0aCBkPSJNMjAgNEMxMS4xNiA0IDQgMTEuMTYgNCAyMHM3LjE2IDE2IDE2IDE2IDE2LTcuMTYgMTYtMTZTMjguODQgNCAyMCA0em0wIDhjMi4yMSAwIDQgMS43OSA0IDRzLTEuNzkgNC00IDQtNC0xLjc5LTQtNCAxLjc5LTQgNC00em0wIDIwYy00LjQyIDAtOC4zMS0yLjI3LTEwLjU4LTUuN0MxMS43IDIzLjk0IDE1Ljg1IDIyLjUgMjAgMjIuNXM4LjMgMS40NCAxMC41OCAzLjhDMjguMzEgMjkuNzMgMjQuNDIgMzIgMjAgMzJ6Ii8+PC9zdmc+';
      
      return \`
        <div class="chat-widget-botao" id="chatBotao">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L1 23l6.71-1.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10s-4.48-10-10-10z"/>
          </svg>
        </div>
        <div class="chat-widget-janela" id="chatJanela" style="display:none;">
          <div class="chat-widget-header">
            <div class="chat-widget-header-info">
              <img src="\${imagemPerfil}" class="chat-widget-avatar" alt="Bot">
              <div>
                <span class="chat-widget-nome">\${this.config.visual.nomeBotVisivel || 'Assistente'}</span>
                <span class="chat-widget-status">Online</span>
              </div>
            </div>
            <div class="chat-widget-header-acoes">
              \${this.config.recursos.mostrarRefresh ? \`
              <button class="chat-widget-refresh" id="chatRefresh" title="Reiniciar conversa">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
              </button>
              \` : ''}
              <button class="chat-widget-fechar" id="chatFechar">×</button>
            </div>
          </div>
          <div class="chat-widget-mensagens" id="chatMensagens"></div>
          \${this.config.recursos.botoesRapidos?.length ? \`
          <div class="chat-widget-botoes-rapidos">
            \${this.config.recursos.botoesRapidos.map(texto => 
              \`<button class="chat-widget-botao-rapido" data-texto="\${texto}">\${texto}</button>\`
            ).join('')}
          </div>
          \` : ''}
          <div class="chat-widget-input-container">
            <input type="text" id="chatInput" placeholder="\${this.config.mensagens.placeholder}">
            <button id="chatEnviar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="\${this.config.visual.corPrimaria}">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      \`;
    },
    
    gerarCSS() {
      const pos = this.config.visual.posicao === 'bottom-left' ? 'left: 20px;' : 'right: 20px;';
      
      return \`
        #chat-widget-container {
          position: fixed;
          bottom: 20px;
          \${pos}
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .chat-widget-botao {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: \${this.config.visual.corPrimaria};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        
        .chat-widget-botao:hover {
          transform: scale(1.1);
        }
        
        .chat-widget-janela {
          position: absolute;
          bottom: 70px;
          \${this.config.visual.posicao === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
          width: \${this.config.visual.largura}px;
          height: \${this.config.visual.altura}px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .chat-widget-header {
          background: \${this.config.visual.corPrimaria};
          color: white;
          padding: 12px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .chat-widget-header-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .chat-widget-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: white;
          object-fit: cover;
        }
        
        .chat-widget-header-info > div {
          display: flex;
          flex-direction: column;
        }
        
        .chat-widget-nome {
          font-weight: 600;
          font-size: 14px;
        }
        
        .chat-widget-status {
          font-size: 11px;
          opacity: 0.9;
        }
        
        .chat-widget-header-acoes {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .chat-widget-refresh {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        
        .chat-widget-refresh:hover {
          opacity: 1;
        }
        
        .chat-widget-fechar {
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
        }
        
        .chat-widget-mensagens {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          background: \${this.config.visual.corSecundaria};
        }
        
        .chat-widget-mensagem {
          margin-bottom: 10px;
          display: flex;
          animation: fadeIn 0.3s;
        }
        
        .chat-widget-mensagem-user {
          justify-content: flex-end;
        }
        
        .chat-widget-mensagem-sistema {
          justify-content: center;
        }
        
        .chat-widget-mensagem-conteudo {
          max-width: 70%;
          padding: 10px 15px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .chat-widget-mensagem-bot .chat-widget-mensagem-conteudo {
          background: white;
          color: #333;
          border-bottom-left-radius: 4px;
        }
        
        .chat-widget-mensagem-user .chat-widget-mensagem-conteudo {
          background: \${this.config.visual.corPrimaria};
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .chat-widget-mensagem-sistema .chat-widget-mensagem-conteudo {
          background: rgba(0, 0, 0, 0.05);
          color: #666;
          font-size: 12px;
          max-width: 90%;
          text-align: center;
        }
        
        .chat-widget-botoes-rapidos {
          padding: 10px;
          background: white;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .chat-widget-botao-rapido {
          padding: 6px 12px;
          background: white;
          border: 1px solid \${this.config.visual.corPrimaria};
          color: \${this.config.visual.corPrimaria};
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .chat-widget-botao-rapido:hover {
          background: \${this.config.visual.corPrimaria};
          color: white;
        }
        
        .chat-widget-input-container {
          padding: 15px;
          background: white;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 10px;
        }
        
        #chatInput {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 24px;
          outline: none;
          font-size: 14px;
        }
        
        #chatEnviar {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
        }
        
        .chat-widget-digitando {
          padding: 10px 15px;
          background: white;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 10px;
        }
        
        .chat-widget-digitando span {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #999;
          margin: 0 2px;
          animation: pulse 1.4s infinite;
        }
        
        .chat-widget-digitando span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .chat-widget-digitando span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
          30% { transform: scale(1.3); opacity: 1; }
        }
      \`;
    },
    
    configurarEventos() {
      // Abrir/fechar chat
      document.getElementById('chatBotao').addEventListener('click', () => this.toggle());
      document.getElementById('chatFechar').addEventListener('click', () => this.fechar());
      
      // Refresh
      const btnRefresh = document.getElementById('chatRefresh');
      if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
          if (confirm('Deseja reiniciar a conversa?')) {
            this.reiniciarConversa();
          }
        });
      }
      
      // Enviar mensagem
      document.getElementById('chatEnviar').addEventListener('click', () => this.enviarMensagem());
      document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.enviarMensagem();
      });
      
      // Botões rápidos
      document.querySelectorAll('.chat-widget-botao-rapido').forEach(btn => {
        btn.addEventListener('click', () => {
          this.enviarMensagem(btn.dataset.texto);
        });
      });
    },
    
    toggle() {
      this.isOpen ? this.fechar() : this.abrir();
    },
    
    abrir() {
      document.getElementById('chatJanela').style.display = 'flex';
      document.getElementById('chatBotao').style.display = 'none';
      this.isOpen = true;
      document.getElementById('chatInput').focus();
      this.registrarAtividade();
    },
    
    fechar() {
      document.getElementById('chatJanela').style.display = 'none';
      document.getElementById('chatBotao').style.display = 'flex';
      this.isOpen = false;
    },
    
    async enviarMensagem(texto) {
      const input = document.getElementById('chatInput');
      const mensagem = texto || input.value.trim();
      
      if (!mensagem) return;
      
      // Registrar atividade
      this.registrarAtividade();
      
      // Limpar input
      input.value = '';
      
      // Adicionar mensagem do usuário
      this.adicionarMensagem(mensagem, 'user');
      
      // Mostrar indicador de digitação
      this.mostrarDigitando();
      
      try {
        const response = await fetch('/api/chat/mensagem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: this.config.widgetId,
            sessionId: this.sessionId,
            mensagem: mensagem
          })
        });
        
        const data = await response.json();
        
        this.removerDigitando();
        
        if (data.tipo === 'timeout') {
          await this.reiniciarPorTimeout();
        } else if (data.sucesso) {
          this.adicionarMensagem(data.resposta.texto, 'bot');
          
          // Tocar som se habilitado
          if (this.config.recursos.som) {
            this.tocarSom();
          }
        } else {
          this.adicionarMensagem('Desculpe, ocorreu um erro.', 'bot');
        }
      } catch (erro) {
        this.removerDigitando();
        this.adicionarMensagem(this.config.mensagens.offline, 'bot');
      }
    },
    
    adicionarMensagem(texto, tipo) {
      const container = document.getElementById('chatMensagens');
      const mensagem = document.createElement('div');
      mensagem.className = \`chat-widget-mensagem chat-widget-mensagem-\${tipo}\`;
      mensagem.innerHTML = \`<div class="chat-widget-mensagem-conteudo">\${texto}</div>\`;
      container.appendChild(mensagem);
      container.scrollTop = container.scrollHeight;
    },
    
    mostrarDigitando() {
      const container = document.getElementById('chatMensagens');
      const digitando = document.createElement('div');
      digitando.id = 'digitandoIndicador';
      digitando.className = 'chat-widget-digitando';
      digitando.innerHTML = '<span></span><span></span><span></span>';
      container.appendChild(digitando);
      container.scrollTop = container.scrollHeight;
    },
    
    removerDigitando() {
      const digitando = document.getElementById('digitandoIndicador');
      if (digitando) digitando.remove();
    },
    
    tocarSom() {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF');
      audio.play().catch(() => {});
    }
  };
  
  window.ChatWidget = ChatWidget;
})();`;

// Função para atualizar arquivos
function atualizarArquivo(caminho, conteudo, append = false) {
  const caminhoCompleto = path.join(process.cwd(), caminho);
  
  try {
    if (append && fs.existsSync(caminhoCompleto)) {
      // Adicionar ao final do arquivo existente
      const conteudoAtual = fs.readFileSync(caminhoCompleto, 'utf-8');
      fs.writeFileSync(caminhoCompleto, conteudoAtual + '\n' + conteudo);
      console.log('    [APPEND] ' + caminho);
    } else {
      // Sobrescrever arquivo
      fs.writeFileSync(caminhoCompleto, conteudo);
      console.log('    [UPDATE] ' + caminho);
    }
  } catch (erro) {
    console.error('    [ERRO] ' + caminho + ': ' + erro.message);
  }
}

// Executar atualizações
console.log('[1] Atualizando tipos TypeScript...');
atualizarArquivo('backend/src/types/widget.types.ts', widgetTypesContent);

console.log('[2] Atualizando controller de chat...');
atualizarArquivo('backend/src/controllers/chat.controller.ts', chatControllerContent);

console.log('[3] Atualizando frontend admin...');
atualizarArquivo('frontend-admin/index.html', adminHtmlContent);
atualizarArquivo('frontend-admin/css/admin.css', adminCssUpdate, true);
atualizarArquivo('frontend-admin/js/configurador.js', configuradorJsUpdate);
atualizarArquivo('frontend-admin/js/upload.js', uploadJsContent);

console.log('[4] Atualizando widget cliente...');
atualizarArquivo('widget/widget.js', widgetJsUpdate);

console.log('\n====================================');
console.log('[OK] Atualizacao concluida!');
console.log('====================================\n');
console.log('Novas funcionalidades adicionadas:');
console.log('- Upload de imagem de perfil do bot');
console.log('- Botao de refresh no chat');
console.log('- Timeout configuravel de inatividade');
console.log('- Aviso antes do timeout');
console.log('- Reinicio automatico por inatividade\n');
console.log('Reinicie o servidor para aplicar as mudancas:');
console.log('npm run dev\n');
console.log('====================================');