// Preview Vivo - Bot Simulado
(function() {
  let previewInterval = null;
  let mensagemIndex = 0;
  
  // Banco de mensagens do bot para parecer real
  const mensagensBot = [
    {
      delay: 3000,
      typing: 1500,
      texto: "Olá! Bem-vindo ao nosso chat 👋"
    },
    {
      delay: 5000,
      typing: 2000,
      texto: "Como posso ajudar você hoje?"
    },
    {
      delay: 7000,
      typing: 1000,
      texto: "Temos várias opções disponíveis!"
    },
    {
      delay: 6000,
      typing: 1800,
      texto: "Você pode me perguntar sobre produtos, preços ou suporte."
    },
    {
      delay: 8000,
      typing: 1200,
      texto: "Estou aqui para facilitar sua vida!"
    }
  ];
  
  // Banco de mensagens do usuário para simular conversa
  const mensagensUsuario = [
    "Olá!",
    "Quero saber mais",
    "Quais são os preços?",
    "Como funciona?",
    "Preciso de ajuda"
  ];
  
  function iniciarPreviewVivo() {
    // Adicionar indicador "AO VIVO"
    const h2 = document.querySelector('.preview-container h2');
    if (h2 && !h2.querySelector('.preview-live-indicator')) {
      const badge = document.createElement('span');
      badge.className = 'preview-live-indicator';
      badge.textContent = 'AO VIVO';
      h2.appendChild(badge);
    }
    
    // Limpar interval anterior se existir
    if (previewInterval) {
      clearInterval(previewInterval);
    }
    
    // Simular conversa a cada X segundos
    previewInterval = setInterval(() => {
      simularInteracao();
    }, 8000);
    
    // Primeira interação após 2 segundos
    setTimeout(simularInteracao, 2000);
  }
  
  function simularInteracao() {
    const iframe = document.getElementById('previewFrame');
    if (!iframe || !iframe.contentWindow) return;
    
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const chatMensagens = doc.getElementById('chatMensagens');
      
      if (!chatMensagens) return;
      
      // Verificar se o chat está muito cheio (mais de 6 mensagens)
      const mensagensExistentes = chatMensagens.querySelectorAll('.chat-widget-mensagem');
      if (mensagensExistentes.length > 6) {
        // Remover mensagens antigas com fade out
        const primeira = mensagensExistentes[0];
        primeira.style.transition = 'opacity 0.3s';
        primeira.style.opacity = '0';
        setTimeout(() => primeira.remove(), 300);
      }
      
      // Alternar entre usuário e bot
      const ehUsuario = Math.random() > 0.6;
      
      if (ehUsuario) {
        // Simular mensagem do usuário
        const msgUsuario = mensagensUsuario[Math.floor(Math.random() * mensagensUsuario.length)];
        adicionarMensagemPreview(chatMensagens, msgUsuario, 'user');
      } else {
        // Simular bot digitando e respondendo
        const msgBot = mensagensBot[mensagemIndex % mensagensBot.length];
        
        // Mostrar indicador de digitação
        mostrarDigitandoPreview(chatMensagens);
        
        // Após "digitar", mostrar mensagem
        setTimeout(() => {
          removerDigitandoPreview(chatMensagens);
          adicionarMensagemPreview(chatMensagens, msgBot.texto, 'bot');
        }, msgBot.typing);
        
        mensagemIndex++;
      }
    } catch (e) {
      // Silenciosamente falhar se não conseguir acessar o iframe
    }
  }
  
  function adicionarMensagemPreview(container, texto, tipo) {
    const mensagem = document.createElement('div');
    mensagem.className = 'chat-widget-mensagem chat-widget-mensagem-' + tipo;
    mensagem.style.opacity = '0';
    mensagem.style.transform = 'translateY(10px)';
    mensagem.innerHTML = '<div class="chat-widget-mensagem-conteudo">' + texto + '</div>';
    
    container.appendChild(mensagem);
    
    // Animação de entrada
    setTimeout(() => {
      mensagem.style.transition = 'all 0.3s ease';
      mensagem.style.opacity = '1';
      mensagem.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto scroll suave
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
  
  function mostrarDigitandoPreview(container) {
    if (container.querySelector('.preview-typing')) return;
    
    const typing = document.createElement('div');
    typing.className = 'chat-widget-mensagem chat-widget-mensagem-bot preview-typing';
    typing.innerHTML = `
      <div class="chat-widget-mensagem-conteudo" style="padding: 12px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#999;margin:0 2px;animation:pulse 1.4s infinite"></span>
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#999;margin:0 2px;animation:pulse 1.4s infinite;animation-delay:0.2s"></span>
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#999;margin:0 2px;animation:pulse 1.4s infinite;animation-delay:0.4s"></span>
      </div>
    `;
    
    container.appendChild(typing);
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
  
  function removerDigitandoPreview(container) {
    const typing = container.querySelector('.preview-typing');
    if (typing) {
      typing.style.transition = 'opacity 0.2s';
      typing.style.opacity = '0';
      setTimeout(() => typing.remove(), 200);
    }
  }
  
  // Reagir às mudanças de configuração com transição suave
  const originalAtualizarPreview = window.atualizarPreviewLocal;
  window.atualizarPreviewLocal = function() {
    const preview = document.getElementById('preview');
    if (preview) {
      preview.classList.add('preview-updating');
      setTimeout(() => {
        preview.classList.remove('preview-updating');
      }, 300);
    }
    
    if (originalAtualizarPreview) {
      originalAtualizarPreview.apply(this, arguments);
    }
    
    // Reiniciar simulação após atualizar
    setTimeout(() => {
      const iframe = document.getElementById('previewFrame');
      if (iframe && iframe.contentDocument) {
        const chatMensagens = iframe.contentDocument.getElementById('chatMensagens');
        if (chatMensagens) {
          // Limpar chat e recomeçar
          chatMensagens.innerHTML = '';
          // Adicionar mensagem de boas-vindas se existir
          const boasVindas = document.getElementById('boasVindas')?.value;
          if (boasVindas) {
            adicionarMensagemPreview(chatMensagens, boasVindas, 'bot');
          }
        }
      }
    }, 350);
  };
  
  // Iniciar quando a página carregar
  document.addEventListener('DOMContentLoaded', function() {
    // Esperar o preview carregar
    setTimeout(iniciarPreviewVivo, 1500);
    
    // Reiniciar ao gerar widget
    const form = document.getElementById('formWidget');
    if (form) {
      form.addEventListener('submit', function() {
        setTimeout(iniciarPreviewVivo, 2000);
      });
    }
  });
  
  // Parar simulação se o usuário sair da página
  window.addEventListener('beforeunload', function() {
    if (previewInterval) {
      clearInterval(previewInterval);
    }
  });
})();