// Melhorias na Experiência de Configuração
(function() {
  'use strict';
  
  // Frases de ajuda contextual
  const dicasHelper = {
    inicio: "👋 Vamos começar! Preencha o nome do cliente primeiro.",
    cliente: "Ótimo! Agora adicione o domínio onde o chat será usado.",
    dominio: "Perfeito! Continue configurando o assistente.",
    dialogflow: "Quase lá! Configure as cores e visual do chat.",
    visual: "Excelente! Ajuste as mensagens do chat.",
    mensagens: "Último passo! Escolha os recursos adicionais.",
    recursos: "Tudo pronto! Clique em Gerar Widget quando quiser.",
    completo: "🎉 Configuração completa! Gere seu widget!"
  };
  
  // Mostrar helper text
  let helperElement = null;
  function mostrarDica(texto) {
    if (!helperElement) {
      helperElement = document.createElement('div');
      helperElement.className = 'helper-text';
      helperElement.innerHTML = '<span class="helper-icon">💡</span><span class="helper-msg"></span>';
      document.body.appendChild(helperElement);
    }
    
    helperElement.querySelector('.helper-msg').textContent = texto;
    helperElement.classList.add('show');
    
    clearTimeout(helperElement.hideTimeout);
    helperElement.hideTimeout = setTimeout(() => {
      helperElement.classList.remove('show');
    }, 5000);
  }
  
  // Verificar progresso de cada seção
  function verificarProgressoSecao(secao) {
    const camposRequeridos = secao.querySelectorAll('input[required], select[required]');
    const camposPreenchidos = secao.querySelectorAll('input[required]:valid, select[required]:valid');
    
    const progresso = camposRequeridos.length > 0 
      ? (camposPreenchidos.length / camposRequeridos.length) * 100 
      : 100;
    
    // Atualizar barra de progresso da seção
    let progressBar = secao.querySelector('.secao-progress');
    if (!progressBar && camposRequeridos.length > 0) {
      progressBar = document.createElement('div');
      progressBar.className = 'secao-progress';
      progressBar.innerHTML = '<div class="secao-progress-bar"></div>';
      secao.insertBefore(progressBar, secao.firstChild.nextSibling);
    }
    
    if (progressBar) {
      const bar = progressBar.querySelector('.secao-progress-bar');
      bar.style.width = progresso + '%';
    }
    
    // Marcar seção como completa
    if (progresso === 100) {
      secao.classList.add('completa');
    } else {
      secao.classList.remove('completa');
    }
    
    return progresso;
  }
  
  // Verificar progresso geral
  function verificarProgressoGeral() {
    const secoes = document.querySelectorAll('.secao');
    let todasCompletas = true;
    let primeiraIncompleta = null;
    
    secoes.forEach(secao => {
      const progresso = verificarProgressoSecao(secao);
      if (progresso < 100 && !primeiraIncompleta) {
        primeiraIncompleta = secao;
        todasCompletas = false;
      }
    });
    
    // Atualizar botão gerar
    const btnGerar = document.querySelector('.btn-gerar');
    if (btnGerar) {
      if (todasCompletas) {
        btnGerar.classList.add('pronto');
        mostrarDica(dicasHelper.completo);
      } else {
        btnGerar.classList.remove('pronto');
      }
    }
    
    return { todasCompletas, primeiraIncompleta };
  }
  
  // Marcar campo como preenchido
  function marcarCampoPreenchido(campo) {
    const wrapper = campo.closest('.campo');
    if (!wrapper) return;
    
    if (campo.value && campo.value.trim() !== '') {
      wrapper.classList.add('preenchido');
    } else {
      wrapper.classList.remove('preenchido');
    }
  }
  
  // Adicionar preview de cor em tempo real
  function adicionarPreviewCor(input) {
    if (input.type !== 'color') return;
    
    const label = input.previousElementSibling;
    if (!label || label.querySelector('.cor-preview')) return;
    
    const preview = document.createElement('span');
    preview.className = 'cor-preview';
    preview.style.background = input.value;
    label.appendChild(preview);
    
    input.addEventListener('input', () => {
      preview.style.background = input.value;
    });
  }
  
  // Contador de caracteres para textareas
  function adicionarContador(textarea) {
    const wrapper = textarea.closest('.campo');
    if (!wrapper || wrapper.querySelector('.contador')) return;
    
    wrapper.classList.add('campo-contador');
    const contador = document.createElement('span');
    contador.className = 'contador';
    wrapper.appendChild(contador);
    
    function atualizar() {
      const length = textarea.value.length;
      contador.textContent = length > 0 ? length + ' caracteres' : '';
    }
    
    textarea.addEventListener('input', atualizar);
    atualizar();
  }
  
  // Destacar seção ativa
  function destacarSecaoAtiva(secao) {
    document.querySelectorAll('.secao').forEach(s => {
      s.classList.remove('ativa');
    });
    secao.classList.add('ativa');
  }
  
  // Smooth scroll para próxima seção incompleta
  function irParaProximaSecao() {
    const { primeiraIncompleta } = verificarProgressoGeral();
    if (primeiraIncompleta) {
      primeiraIncompleta.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      destacarSecaoAtiva(primeiraIncompleta);
    }
  }
  
  // Inicialização
  document.addEventListener('DOMContentLoaded', function() {
    // Configurar todos os campos
    document.querySelectorAll('input, select, textarea').forEach(campo => {
      // Marcar campos já preenchidos
      marcarCampoPreenchido(campo);
      
      // Eventos de foco
      campo.addEventListener('focus', () => {
        const wrapper = campo.closest('.campo');
        if (wrapper) wrapper.classList.add('focado');
        
        const secao = campo.closest('.secao');
        if (secao) destacarSecaoAtiva(secao);
      });
      
      campo.addEventListener('blur', () => {
        const wrapper = campo.closest('.campo');
        if (wrapper) wrapper.classList.remove('focado');
      });
      
      // Eventos de input
      campo.addEventListener('input', () => {
        marcarCampoPreenchido(campo);
        verificarProgressoGeral();
      });
      
      // Enter vai para próximo campo
      if (campo.tagName !== 'TEXTAREA') {
        campo.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const campos = Array.from(document.querySelectorAll('input, select, textarea'));
            const index = campos.indexOf(campo);
            if (index < campos.length - 1) {
              campos[index + 1].focus();
            }
          }
        });
      }
    });
    
    // Adicionar preview de cores
    document.querySelectorAll('input[type="color"]').forEach(adicionarPreviewCor);
    
    // Adicionar contadores
    document.querySelectorAll('textarea').forEach(adicionarContador);
    
    // Verificar progresso inicial
    verificarProgressoGeral();
    
    // Mostrar dica inicial após 1 segundo
    setTimeout(() => {
      mostrarDica(dicasHelper.inicio);
    }, 1000);
    
    // Botão Tab para ir para próxima seção incompleta
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && e.shiftKey && e.ctrlKey) {
        e.preventDefault();
        irParaProximaSecao();
      }
    });
    
    // Auto-foco no primeiro campo vazio
    const primeiroCampoVazio = document.querySelector('input[required]:invalid, select[required]:invalid');
    if (primeiroCampoVazio) {
      primeiroCampoVazio.focus();
    }
  });
})();