function atualizarPreview(config) {
  const iframe = document.getElementById('previewFrame');
  const html = gerarHTMLPreview(config);
  
  iframe.srcdoc = html;
}

function atualizarPreviewLocal() {
  const config = {
    visual: {
      corPrimaria: document.getElementById('corPrimaria').value,
      corSecundaria: document.getElementById('corSecundaria').value,
      posicao: document.getElementById('posicao').value,
      largura: parseInt(document.getElementById('largura').value),
      altura: parseInt(document.getElementById('altura').value)
    },
    mensagens: {
      boasVindas: document.getElementById('boasVindas').value,
      placeholder: document.getElementById('placeholder').value
    },
    recursos: {
      botoesRapidos: document.getElementById('botoesRapidos').value.split('\n').filter(b => b.trim())
    }
  };
  
  atualizarPreview(config);
}

function gerarHTMLPreview(config) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: ${config.visual?.posicao === 'bottom-left' ? 'flex-start' : 'flex-end'};
      align-items: flex-end;
      height: 100vh;
    }
    
    .chat-widget {
      width: ${config.visual?.largura || 350}px;
      height: ${config.visual?.altura || 500}px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .chat-header {
      background: ${config.visual?.corPrimaria || '#4285f4'};
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chat-title {
      font-weight: 600;
      font-size: 16px;
    }
    
    .chat-close {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: ${config.visual?.corSecundaria || '#f0f0f0'};
    }
    
    .message {
      margin-bottom: 15px;
      animation: slideIn 0.3s ease;
    }
    
    .message-bot {
      background: white;
      padding: 10px 15px;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      max-width: 80%;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .botoes-rapidos {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 20px;
      background: white;
      border-top: 1px solid #e0e0e0;
    }
    
    .botao-rapido {
      padding: 6px 12px;
      background: white;
      border: 1px solid ${config.visual?.corPrimaria || '#4285f4'};
      color: ${config.visual?.corPrimaria || '#4285f4'};
      border-radius: 20px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .botao-rapido:hover {
      background: ${config.visual?.corPrimaria || '#4285f4'};
      color: white;
    }
    
    .chat-input-container {
      padding: 15px;
      background: white;
      border-top: 1px solid #e0e0e0;
    }
    
    .chat-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 24px;
      outline: none;
      font-size: 14px;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</head>
<body>
  <div class="chat-widget">
    <div class="chat-header">
      <div class="chat-title">Chat</div>
      <div class="chat-close">×</div>
    </div>
    <div class="chat-messages">
      <div class="message">
        <div class="message-bot">${config.mensagens?.boasVindas || 'Olá! Como posso ajudar?'}</div>
      </div>
    </div>
    ${config.recursos?.botoesRapidos?.length ? `
    <div class="botoes-rapidos">
      ${config.recursos.botoesRapidos.map(b => `<button class="botao-rapido">${b}</button>`).join('')}
    </div>
    ` : ''}
    <div class="chat-input-container">
      <input type="text" class="chat-input" placeholder="${config.mensagens?.placeholder || 'Digite sua mensagem...'}">
    </div>
  </div>
</body>
</html>
`;
}

// Inicializar preview vazio
atualizarPreview({});

// Adicionar ao final do arquivo preview.js existente

// Detectar quando o preview está fixado
document.addEventListener('DOMContentLoaded', function() {
  const previewContainer = document.querySelector('.preview-container');
  const content = document.querySelector('.content');
  
  if (previewContainer && content) {
    // Criar um indicador visual opcional
    const indicator = document.createElement('span');
    indicator.className = 'preview-indicator';
    indicator.textContent = 'Fixado';
    
    const h2 = previewContainer.querySelector('h2');
    if (h2) {
      h2.appendChild(indicator);
    }
    
    // Observer para detectar quando está sticky
    const observer = new IntersectionObserver(
      ([e]) => {
        const isSticky = e.intersectionRatio < 1;
        previewContainer.classList.toggle('is-sticky', isSticky);
        indicator.classList.toggle('visible', isSticky);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );
    
    // Observar um elemento sentinela
    const sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.top = '0';
    sentinel.style.height = '1px';
    sentinel.style.width = '1px';
    previewContainer.insertBefore(sentinel, previewContainer.firstChild);
    observer.observe(sentinel);
    
    // Ajustar altura do preview baseado na viewport
    function ajustarAlturaPreview() {
      const viewportHeight = window.innerHeight;
      const preview = document.getElementById('preview');
      if (preview && viewportHeight > 700) {
        // Se a tela for alta, aumentar o preview
        const novaAltura = Math.min(viewportHeight - 200, 700);
        preview.style.height = novaAltura + 'px';
      }
    }
    
    ajustarAlturaPreview();
    window.addEventListener('resize', ajustarAlturaPreview);
  }
});

// Smooth scroll ao clicar em seções (opcional)
document.querySelectorAll('.secao h2').forEach(titulo => {
  titulo.style.cursor = 'pointer';
  titulo.addEventListener('click', function() {
    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});