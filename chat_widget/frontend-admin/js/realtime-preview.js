// Preview em tempo real corrigido
(function() {
  'use strict';
  
  let updateTimeout = null;
  
  // Função principal de atualização do preview
  function atualizarPreviewCompleto() {
    const iframe = document.getElementById('previewFrame');
    if (!iframe) return;
    
    // Esperar o iframe carregar completamente
    const updatePreview = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
        
        // Pegar valores atuais dos campos
        const corPrimaria = document.getElementById('corPrimaria')?.value || '#2c3e50';
        const corSecundaria = document.getElementById('corSecundaria')?.value || '#f7f8fc';
        const nomeBotVisivel = document.getElementById('nomeBotVisivel')?.value || 'Assistente';
        const boasVindas = document.getElementById('boasVindas')?.value || 'Olá! Como posso ajudar?';
        const placeholder = document.getElementById('placeholder')?.value || 'Digite sua mensagem...';
        const botoesRapidos = document.getElementById('botoesRapidos')?.value || '';
        
        // Atualizar estilos CSS diretamente no iframe
        let styleElement = iframeDoc.getElementById('dynamic-preview-styles');
        if (!styleElement) {
          styleElement = iframeDoc.createElement('style');
          styleElement.id = 'dynamic-preview-styles';
          iframeDoc.head.appendChild(styleElement);
        }
        
        // CSS dinâmico para cores
        styleElement.textContent = `
          /* Cores dinâmicas do preview */
          .chat-widget-header,
          .chat-header {
            background: ${corPrimaria} !important;
          }
          
          .chat-widget-mensagens,
          .chat-messages {
            background: ${corSecundaria} !important;
          }
          
          .chat-widget-mensagem-user .chat-widget-mensagem-conteudo,
          .message-user {
            background: ${corPrimaria} !important;
            color: white !important;
          }
          
          .chat-widget-botao-rapido,
          .botao-rapido {
            border-color: ${corPrimaria} !important;
            color: ${corPrimaria} !important;
          }
          
          .chat-widget-botao-rapido:hover,
          .botao-rapido:hover {
            background: ${corPrimaria} !important;
            color: white !important;
          }
          
          #chatEnviar svg {
            fill: ${corPrimaria} !important;
          }
          
          .chat-widget-botao {
            background: ${corPrimaria} !important;
          }
        `;
        
        // Atualizar textos
        const nomeElement = iframeDoc.querySelector('.chat-widget-nome, .chat-title, .chat-header span');
        if (nomeElement) {
          nomeElement.textContent = nomeBotVisivel;
        }
        
        // Atualizar mensagem de boas-vindas
        const mensagemBoasVindas = iframeDoc.querySelector('.message-bot .chat-widget-mensagem-conteudo, .chat-widget-mensagem-bot .chat-widget-mensagem-conteudo');
        if (mensagemBoasVindas) {
          mensagemBoasVindas.textContent = boasVindas;
        }
        
        // Atualizar placeholder do input
        const inputElement = iframeDoc.querySelector('#chatInput, input[type="text"]');
        if (inputElement) {
          inputElement.placeholder = placeholder;
        }
        
        // Atualizar botões rápidos
        if (botoesRapidos) {
          const botoes = botoesRapidos.split('\n').filter(b => b.trim());
          const containerBotoes = iframeDoc.querySelector('.chat-widget-botoes-rapidos, .botoes-rapidos');
          
          if (containerBotoes) {
            containerBotoes.innerHTML = botoes.map(texto => 
              `<button class="chat-widget-botao-rapido botao-rapido" style="border-color: ${corPrimaria}; color: ${corPrimaria}">${texto.trim()}</button>`
            ).join('');
          }
        }
        
      } catch (error) {
        console.log('Preview update error:', error);
      }
    };
    
    // Executar atualização
    updatePreview();
  }
  
  // Função debounce para evitar muitas atualizações
  function debounceUpdate() {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(atualizarPreviewCompleto, 50);
  }
  
  // Inicialização quando o DOM carregar
  document.addEventListener('DOMContentLoaded', function() {
    
    // Aguardar o iframe carregar completamente
    const iframe = document.getElementById('previewFrame');
    if (iframe) {
      iframe.addEventListener('load', function() {
        console.log('Preview iframe carregado');
        
        // Atualizar preview inicial
        setTimeout(atualizarPreviewCompleto, 500);
        
        // Adicionar listeners para todos os campos relevantes
        const camposMonitorados = [
          'corPrimaria',
          'corSecundaria', 
          'nomeBotVisivel',
          'boasVindas',
          'placeholder',
          'offline',
          'timeoutAviso',
          'timeoutReinicio',
          'botoesRapidos',
          'posicao',
          'largura',
          'altura'
        ];
        
        camposMonitorados.forEach(campoId => {
          const campo = document.getElementById(campoId);
          if (campo) {
            // Para campos de cor
            if (campo.type === 'color') {
              // Múltiplos eventos para garantir captura
              campo.addEventListener('input', debounceUpdate);
              campo.addEventListener('change', debounceUpdate);
              
              // Hack para Chrome/Edge que às vezes não dispara input
              let ultimaCor = campo.value;
              setInterval(() => {
                if (campo.value !== ultimaCor) {
                  ultimaCor = campo.value;
                  debounceUpdate();
                }
              }, 100);
            }
            // Para selects
            else if (campo.tagName === 'SELECT') {
              campo.addEventListener('change', debounceUpdate);
            }
            // Para inputs de texto e textarea
            else {
              campo.addEventListener('input', debounceUpdate);
              campo.addEventListener('keyup', debounceUpdate);
            }
          }
        });
        
        // Monitorar mudanças no color picker do navegador
        document.addEventListener('input', function(e) {
          if (e.target && (e.target.id === 'corPrimaria' || e.target.id === 'corSecundaria')) {
            debounceUpdate();
          }
        });
      });
    }
    
    // Atualizar ao gerar widget
    const formWidget = document.getElementById('formWidget');
    if (formWidget) {
      formWidget.addEventListener('submit', function() {
        setTimeout(atualizarPreviewCompleto, 100);
      });
    }
  });
  
  // Exportar globalmente para outros scripts usarem
  window.atualizarPreviewCompleto = atualizarPreviewCompleto;
  window.atualizarPreviewLocal = debounceUpdate;
})();

// Forçar atualização ao mudar de aba/janela (bug do Chrome com color picker)
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && window.atualizarPreviewCompleto) {
    setTimeout(window.atualizarPreviewCompleto, 100);
  }
});