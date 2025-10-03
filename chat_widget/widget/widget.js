(function() {
  // Detectar URL base do script atual
  const scripts = document.getElementsByTagName('script');
  let baseUrl = 'http://localhost:3000';
  
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.includes('/widget/widget.js')) {
      const url = new URL(scripts[i].src);
      baseUrl = url.origin;
      break;
    }
  }
  
  const ChatWidget = {
    config: null,
    sessionId: null,
    isOpen: false,
    container: null,
    baseUrl: baseUrl,
    mensagemBoasVindasMostrada: false,
    notificacaoCount: 0,
    
    async inicializar(opcoes) {
      if (!opcoes.widgetId) {
        console.error('Widget ID é obrigatório');
        return;
      }
      
      console.log('Inicializando widget premium com base URL:', this.baseUrl);
      
      // Buscar configuração
      try {
        const response = await fetch(`${this.baseUrl}/api/widgets/${opcoes.widgetId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.sucesso) {
          console.error('Widget não encontrado');
          return;
        }
        
        this.config = data.widget;
        this.criarWidget();
        this.iniciarSessao();
        
        // Sequência de entrada premium
        setTimeout(() => {
          this.mostrarIndicadorDigitando();
          setTimeout(() => {
            this.ocultarIndicadorDigitando();
            this.mostrarMensagemFlutuante();
            this.tocarSomNotificacao();
            this.incrementarNotificacao();
          }, 2000);
        }, 1500);
        
      } catch (erro) {
        console.error('Erro ao inicializar widget:', erro);
      }
    },
    
  async iniciarSessao() {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/sessao/${this.config.widgetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      this.sessionId = data.sessionId;
      
      // SEMPRE usa a mensagem que vem do Dialogflow
      if (data.mensagemInicial) {
        // Limpa mensagens antigas
        const container = document.getElementById('chatMensagens');
        if (container) {
          container.innerHTML = '';
        }
        // Adiciona a mensagem do Dialogflow
        this.adicionarMensagem(data.mensagemInicial, 'bot');
        console.log('[WIDGET] Mensagem inicial do Dialogflow recebida');
      }
      
      // Configurações de timeout se existirem
      if (data.timeoutHabilitado && data.timeoutMinutos) {
        this.configurarTimeout(data.timeoutMinutos);
      }
      
    } catch (erro) {
      console.error('[WIDGET] Erro ao iniciar sessão:', erro);
      // Se falhar, adiciona mensagem padrão
      this.adicionarMensagem('Olá! Como posso ajudar?', 'bot');
    }
  },
    
    mostrarIndicadorDigitando() {
      const indicador = document.getElementById('chatIndicadorDigitando');
      if (indicador) {
        indicador.style.display = 'flex';
      }
    },
    
    ocultarIndicadorDigitando() {
      const indicador = document.getElementById('chatIndicadorDigitando');
      if (indicador) {
        indicador.style.display = 'none';
      }
    },
    
    incrementarNotificacao() {
      if (!this.isOpen) {
        this.notificacaoCount++;
        const badge = document.getElementById('chatNotificationBadge');
        if (badge) {
          badge.textContent = this.notificacaoCount;
          badge.style.display = 'flex';
          badge.classList.add('bounce');
          setTimeout(() => badge.classList.remove('bounce'), 600);
        }
      }
    },
    
    limparNotificacoes() {
      this.notificacaoCount = 0;
      const badge = document.getElementById('chatNotificationBadge');
      if (badge) {
        badge.style.display = 'none';
      }
    },
    
    tocarSomNotificacao() {
      if (this.config.recursos.som) {
        const audio = new Audio('data:audio/wav;base64,UklGRhwMAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YfgLAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADC');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    },
    
    mostrarMensagemFlutuante() {
      if (this.mensagemBoasVindasMostrada || this.isOpen) return;
      
      const mensagemEl = document.getElementById('chatMensagemFlutuante');
      if (mensagemEl) {
        mensagemEl.style.display = 'block';
        mensagemEl.style.animation = 'slideInBounce 0.5s ease-out';
        this.mensagemBoasVindasMostrada = true;
        
        // Auto-ocultar após 12 segundos
        setTimeout(() => {
          if (!this.isOpen) {
            this.ocultarMensagemFlutuante();
          }
        }, 12000);
      }
    },
    
    ocultarMensagemFlutuante() {
      const mensagemEl = document.getElementById('chatMensagemFlutuante');
      if (mensagemEl) {
        mensagemEl.style.animation = 'slideOutFade 0.3s ease-out';
        setTimeout(() => {
          mensagemEl.style.display = 'none';
        }, 300);
      }
    },
    
    async reiniciarConversa() {
      const container = document.getElementById('chatMensagens');
      container.innerHTML = '';
      
      await this.iniciarSessao();
      
      if (this.config.mensagens.boasVindas) {
        this.adicionarMensagem(this.config.mensagens.boasVindas, 'bot');
      }
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
      
      // Mostrar mensagem de boas-vindas no chat quando abrir
      if (this.config.mensagens.boasVindas) {
        this.adicionarMensagem(this.config.mensagens.boasVindas, 'bot');
      }
    },
    
    gerarHTML() {
      const imagemPerfil = this.config.visual.imagemPerfil || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IndoaXRlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzRhNWY3ZiIvPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMjAgMTJjLTIuMiAwLTQgMS44LTQgNHMxLjggNCA0IDQgNC0xLjggNC00LTEuOC00LTQtNHptMCA2Yy0xLjEgMC0yLS45LTItMnMuOS0yIDItMiAyIC45IDIgMi0uOSAyLTIgMnptMCA0Yy0yLjcgMC01IC45LTYuOSAyLjVDMTQuNiAyNi4yIDE3LjIgMjcgMjAgMjdzNS40LS44IDYuOS0yLjVDMjUgMjIuOSAyMi43IDIyIDIwIDIyeiIvPjwvc3ZnPg==';
      const nomeBotVisivel = this.config.visual.nomeBotVisivel || 'Assistente';
      
      return `
        <!-- Botão flutuante com avatar -->
        <div class="chat-widget-wrapper">
          <div class="chat-widget-botao" id="chatBotao">
            <div class="chat-widget-botao-inner">
              <img src="${imagemPerfil}" alt="${nomeBotVisivel}" class="chat-widget-botao-avatar">
              <div class="chat-widget-status-indicator"></div>
            </div>
            <div class="chat-widget-notification-badge" id="chatNotificationBadge" style="display:none">1</div>
          </div>
          
          <!-- Indicador de digitando flutuante -->
          <div class="chat-widget-typing-indicator" id="chatIndicadorDigitando" style="display:none;">
            <span></span><span></span><span></span>
          </div>
        </div>
        
        <!-- Mensagem flutuante de boas-vindas -->
        <div class="chat-widget-mensagem-flutuante" id="chatMensagemFlutuante" style="display:none;">
          <button class="chat-widget-fechar-flutuante" onclick="ChatWidget.ocultarMensagemFlutuante()">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 1L1 11M1 1L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="chat-widget-mensagem-flutuante-header">
            <img src="${imagemPerfil}" alt="${nomeBotVisivel}">
            <div>
              <span class="chat-widget-mensagem-nome">${nomeBotVisivel}</span>
              <span class="chat-widget-mensagem-status">Online agora</span>
            </div>
          </div>
          <div class="chat-widget-mensagem-flutuante-corpo">
            ${this.config.mensagens.boasVindas}
          </div>
          <div class="chat-widget-mensagem-flutuante-footer">
            <button onclick="ChatWidget.abrir()" class="chat-widget-cta-button">
              Iniciar conversa →
            </button>
          </div>
        </div>
        
        <!-- Janela do chat -->
        <div class="chat-widget-janela" id="chatJanela" style="display:none;">
          <div class="chat-widget-header">
            <div class="chat-widget-header-info">
              <img src="${imagemPerfil}" class="chat-widget-avatar" alt="Bot">
              <div>
                <span class="chat-widget-nome">${nomeBotVisivel}</span>
                <span class="chat-widget-status">
                  <span class="status-dot"></span> Online
                </span>
              </div>
            </div>
            <div class="chat-widget-header-acoes">
              ${this.config.recursos.mostrarRefresh ? `
              <button class="chat-widget-refresh" id="chatRefresh" title="Reiniciar conversa">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
              </button>
              ` : ''}
              <button class="chat-widget-minimize" id="chatMinimize" title="Minimizar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
              <button class="chat-widget-fechar" id="chatFechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="chat-widget-mensagens" id="chatMensagens"></div>
          
          ${this.config.recursos.botoesRapidos?.length ? `
          <div class="chat-widget-botoes-rapidos">
            ${this.config.recursos.botoesRapidos.map(texto => 
              `<button class="chat-widget-botao-rapido" data-texto="${texto}">
                <span class="botao-rapido-icon">💬</span>
                ${texto}
              </button>`
            ).join('')}
          </div>
          ` : ''}
          
          <div class="chat-widget-input-container">
            ${this.config.recursos.upload ? `
            <button class="chat-widget-upload" id="chatUpload" title="Enviar arquivo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
              </svg>
            </button>
            <input type="file" id="chatFileInput" style="display:none;" accept="image/*,.pdf,.doc,.docx">
            ` : ''}
            <input type="text" id="chatInput" placeholder="${this.config.mensagens.placeholder}">
            <button id="chatEnviar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    },
    
    gerarCSS() {
      const pos = this.config.visual.posicao === 'bottom-left' ? 'left: 20px;' : 'right: 20px;';
      const corPrimaria = this.config.visual.corPrimaria;
      
      return `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        #chat-widget-container {
          position: fixed;
          bottom: 20px;
          ${pos}
          z-index: 999999;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Wrapper para botão e indicador */
        .chat-widget-wrapper {
          position: relative;
        }
        
        /* Botão flutuante premium */
        .chat-widget-botao {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%);
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 8px 25px ${corPrimaria}40;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: visible;
        }
        
        .chat-widget-botao:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 6px 25px rgba(0,0,0,0.2), 0 12px 35px ${corPrimaria}50;
        }
        
        .chat-widget-botao:active {
          transform: scale(0.98);
        }
        
        .chat-widget-botao-inner {
          width: 100%;
          height: 100%;
          position: relative;
          border-radius: 50%;
          overflow: hidden;
        }
        
        .chat-widget-botao-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        
        /* Status indicator (online) */
        .chat-widget-status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 18px;
          height: 18px;
          background: #22c55e;
          border: 3px solid white;
          border-radius: 50%;
          animation: pulse-status 2s infinite;
        }
        
        @keyframes pulse-status {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
        }
        
        /* Notification badge */
        .chat-widget-notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          min-width: 22px;
          height: 22px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          border: 2px solid white;
        }
        
        .chat-widget-notification-badge.bounce {
          animation: bounce-badge 0.6s ease-out;
        }
        
        @keyframes bounce-badge {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(0.9); }
          75% { transform: scale(1.1); }
        }
        
        /* Typing indicator flutuante */
        .chat-widget-typing-indicator {
          position: absolute;
          bottom: 75px;
          ${this.config.visual.posicao === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
          background: white;
          padding: 12px 16px;
          border-radius: 20px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.1);
          display: flex;
          gap: 4px;
          align-items: center;
        }
        
        .chat-widget-typing-indicator span {
          width: 8px;
          height: 8px;
          background: #999;
          border-radius: 50%;
          animation: typing-bounce 1.4s infinite;
        }
        
        .chat-widget-typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .chat-widget-typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-10px); opacity: 1; }
        }
        
        /* Mensagem flutuante premium */
        .chat-widget-mensagem-flutuante {
          position: absolute;
          bottom: 80px;
          ${this.config.visual.posicao === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.08);
          width: 320px;
          max-width: calc(100vw - 40px);
          z-index: 999998;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        @keyframes slideInBounce {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          50% {
            transform: translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideOutFade {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
        }
        
        .chat-widget-fechar-flutuante {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0,0,0,0.05);
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #666;
          z-index: 2;
        }
        
        .chat-widget-fechar-flutuante:hover {
          background: rgba(0,0,0,0.1);
          transform: rotate(90deg);
        }
        
        .chat-widget-mensagem-flutuante-header {
          padding: 16px;
          padding-right: 48px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        
        .chat-widget-mensagem-flutuante-header img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .chat-widget-mensagem-nome {
          font-weight: 600;
          color: #1f2937;
          font-size: 15px;
          display: block;
        }
        
        .chat-widget-mensagem-status {
          font-size: 12px;
          color: #22c55e;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }
        
        .chat-widget-mensagem-flutuante-corpo {
          padding: 16px;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .chat-widget-mensagem-flutuante-footer {
          padding: 12px 16px;
          background: #f9fafb;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        
        .chat-widget-cta-button {
          width: 100%;
          padding: 10px 16px;
          background: linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px ${corPrimaria}40;
        }
        
        .chat-widget-cta-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${corPrimaria}50;
        }
        
        .chat-widget-cta-button:active {
          transform: translateY(0);
        }
        
        /* Janela do chat premium */
        .chat-widget-janela {
          position: absolute;
          bottom: 0;
          ${this.config.visual.posicao === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
          width: ${this.config.visual.largura}px;
          height: ${this.config.visual.altura}px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .chat-widget-header {
          background: linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}ee 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .chat-widget-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-widget-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .chat-widget-nome {
          font-weight: 600;
          display: block;
          font-size: 15px;
        }
        
        .chat-widget-status {
          font-size: 12px;
          opacity: 0.95;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }
        
        .status-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-dot 2s infinite;
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .chat-widget-header-acoes {
          display: flex;
          gap: 6px;
        }
        
        .chat-widget-refresh,
        .chat-widget-minimize,
        .chat-widget-fechar {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .chat-widget-refresh:hover,
        .chat-widget-minimize:hover,
        .chat-widget-fechar:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        
        .chat-widget-refresh:active,
        .chat-widget-minimize:active,
        .chat-widget-fechar:active {
          transform: translateY(0);
        }
        
        .chat-widget-mensagens {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: linear-gradient(to bottom, #f9fafb, #ffffff);
        }
        
        /* Scrollbar customizada */
        .chat-widget-mensagens::-webkit-scrollbar {
          width: 6px;
        }
        
        .chat-widget-mensagens::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .chat-widget-mensagens::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .chat-widget-mensagens::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Mensagens */
        .chat-widget-mensagem {
          margin-bottom: 16px;
          display: flex;
          animation: fadeInMessage 0.3s ease-out;
        }
        
        @keyframes fadeInMessage {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .chat-widget-mensagem-user {
          justify-content: flex-end;
        }
        
        .chat-widget-mensagem-bot {
          justify-content: flex-start;
        }
        
        .chat-widget-mensagem-conteudo {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          line-height: 1.5;
          font-size: 14px;
          position: relative;
        }
        
        .chat-widget-mensagem-user .chat-widget-mensagem-conteudo {
          background: linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 2px 8px ${corPrimaria}30;
        }
        
        .chat-widget-mensagem-bot .chat-widget-mensagem-conteudo {
          background: white;
          color: #374151;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        /* Botões rápidos premium */
        .chat-widget-botoes-rapidos {
          padding: 12px;
          background: linear-gradient(to top, #ffffff, #f9fafb);
          border-top: 1px solid rgba(0,0,0,0.05);
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .chat-widget-botao-rapido {
          padding: 8px 14px;
          background: white;
          border: 1.5px solid ${corPrimaria}40;
          color: ${corPrimaria};
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .botao-rapido-icon {
          font-size: 14px;
        }
        
        .chat-widget-botao-rapido:hover {
          background: linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%);
          color: white;
          border-color: ${corPrimaria};
          transform: translateY(-2px);
          box-shadow: 0 4px 12px ${corPrimaria}40;
        }
        
        /* Input container premium */
        .chat-widget-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid rgba(0,0,0,0.05);
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .chat-widget-upload {
          background: #f3f4f6;
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #6b7280;
        }
        
        .chat-widget-upload:hover {
          background: #e5e7eb;
          color: ${corPrimaria};
        }
        
        #chatInput {
          flex: 1;
          border: 1.5px solid #e5e7eb;
          border-radius: 24px;
          padding: 10px 18px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          background: #f9fafb;
        }
        
        #chatInput:focus {
          border-color: ${corPrimaria};
          background: white;
          box-shadow: 0 0 0 3px ${corPrimaria}20;
        }
        
        #chatEnviar {
          background: linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%);
          color: white;
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px ${corPrimaria}40;
        }
        
        #chatEnviar:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px ${corPrimaria}50;
        }
        
        #chatEnviar:active {
          transform: scale(0.95);
        }
        
        /* Typing animation no chat */
        .chat-widget-digitando {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: white;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          width: fit-content;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        .chat-widget-digitando span {
          width: 8px;
          height: 8px;
          background: ${corPrimaria};
          border-radius: 50%;
          animation: digitando 1.4s infinite;
        }
        
        .chat-widget-digitando span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .chat-widget-digitando span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes digitando {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        
        /* Responsivo premium */
        @media (max-width: 480px) {
          .chat-widget-janela {
            width: 100vw;
            height: 100vh;
            bottom: 0;
            right: 0 !important;
            left: 0 !important;
            border-radius: 0;
          }
          
          .chat-widget-mensagem-flutuante {
            width: calc(100vw - 40px);
            max-width: none;
            left: 20px !important;
            right: 20px !important;
          }
        }
      `;
    },
    
    configurarEventos() {
      // Continua o código dos eventos...
      document.getElementById('chatBotao').addEventListener('click', () => {
        this.toggle();
        this.limparNotificacoes();
      });
      
      const mensagemFlutuante = document.getElementById('chatMensagemFlutuante');
      if (mensagemFlutuante) {
        mensagemFlutuante.addEventListener('click', (e) => {
          if (e.target.closest('.chat-widget-fechar-flutuante')) return;
          this.ocultarMensagemFlutuante();
          this.abrir();
          this.limparNotificacoes();
        });
      }
      
      document.getElementById('chatFechar').addEventListener('click', () => this.fechar());
      document.getElementById('chatMinimize')?.addEventListener('click', () => this.fechar());
      
      const btnRefresh = document.getElementById('chatRefresh');
      if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
          if (confirm('Deseja reiniciar a conversa?')) {
            this.reiniciarConversa();
          }
        });
      }
      
      const btnUpload = document.getElementById('chatUpload');
      const fileInput = document.getElementById('chatFileInput');
      
      if (btnUpload && fileInput) {
        btnUpload.addEventListener('click', () => {
          fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            this.processarArquivo(file);
            fileInput.value = '';
          }
        });
      }
      
      document.getElementById('chatEnviar').addEventListener('click', () => this.enviarMensagem());
      document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.enviarMensagem();
      });
      
      document.querySelectorAll('.chat-widget-botao-rapido').forEach(btn => {
        btn.addEventListener('click', () => {
          this.enviarMensagem(btn.dataset.texto);
        });
      });
    },
    
    processarArquivo(file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.adicionarMensagem('Arquivo muito grande. Máximo: 5MB', 'sistema');
        return;
      }
      
      const mensagemArquivo = `📎 ${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
      this.adicionarMensagem(mensagemArquivo, 'user');
      
      this.mostrarDigitando();
      setTimeout(() => {
        this.removerDigitando();
        this.adicionarMensagem('Arquivo recebido! Estou processando...', 'bot');
      }, 1500);
    },
    
    toggle() {
      this.isOpen ? this.fechar() : this.abrir();
    },
    
    abrir() {
      this.ocultarMensagemFlutuante();
      this.ocultarIndicadorDigitando();
      document.getElementById('chatJanela').style.display = 'flex';
      document.getElementById('chatBotao').style.display = 'none';
      this.isOpen = true;
      document.getElementById('chatInput').focus();
      
      // Animação do botão
      const botao = document.getElementById('chatBotao');
      botao.style.animation = 'bounceOut 0.3s ease-out';
    },
    
    fechar() {
      document.getElementById('chatJanela').style.display = 'none';
      document.getElementById('chatBotao').style.display = 'flex';
      this.isOpen = false;
      
      // Animação do botão
      const botao = document.getElementById('chatBotao');
      botao.style.animation = 'bounceIn 0.3s ease-out';
    },
    
    async enviarMensagem(texto) {
      const input = document.getElementById('chatInput');
      const mensagem = texto || input.value.trim();
      
      if (!mensagem) return;
      
      input.value = '';
      this.adicionarMensagem(mensagem, 'user');
      this.mostrarDigitando();
      
      try {
        const response = await fetch(`${this.baseUrl}/api/chat/mensagem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            widgetId: this.config.widgetId,
            sessionId: this.sessionId,
            mensagem: mensagem
          })
        });
        
        const data = await response.json();
        
        this.removerDigitando();
        
        if (data.sucesso) {
          this.adicionarMensagem(data.resposta.texto, 'bot');
          this.tocarSomNotificacao();
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
      mensagem.className = `chat-widget-mensagem chat-widget-mensagem-${tipo}`;
      mensagem.innerHTML = `<div class="chat-widget-mensagem-conteudo">${texto}</div>`;
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
      this.tocarSomNotificacao();
    }
  };
  
  // Tornar global
  window.ChatWidget = ChatWidget;
})();