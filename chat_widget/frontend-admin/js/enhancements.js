// Funcionalidades essenciais e funcionais
document.addEventListener('DOMContentLoaded', function() {
  
  // Temas rápidos simplificados
  const temas = {
    profissional: {
      nome: 'Profissional',
      primaria: '#2c3e50',
      secundaria: '#f7f8fc'
    },
    moderno: {
      nome: 'Moderno',
      primaria: '#4299e1',
      secundaria: '#ebf8ff'
    },
    escuro: {
      nome: 'Escuro',
      primaria: '#1a202c',
      secundaria: '#2d3748'
    },
    suave: {
      nome: 'Suave',
      primaria: '#805ad5',
      secundaria: '#faf5ff'
    },
    vibrante: {
      nome: 'Vibrante',
      primaria: '#ed8936',
      secundaria: '#fffaf0'
    }
  };
  
  // Adicionar seletor de temas se não existir
  function adicionarTemas() {
    const secaoVisual = document.querySelector('.secao h2:nth-of-type(1)');
    if (!secaoVisual || document.querySelector('.temas-rapidos')) return;
    
    const container = document.createElement('div');
    container.className = 'temas-rapidos';
    container.innerHTML = '<label>Temas rápidos:</label><div class="temas-grid"></div>';
    
    const grid = container.querySelector('.temas-grid');
    
    Object.keys(temas).forEach(key => {
      const tema = temas[key];
      const opcao = document.createElement('div');
      opcao.className = 'tema-opcao';
      opcao.dataset.tema = key;
      opcao.innerHTML = `
        <div class="tema-cor" style="background: ${tema.primaria}"></div>
        <div class="tema-nome">${tema.nome}</div>
      `;
      
      opcao.addEventListener('click', () => aplicarTema(key));
      grid.appendChild(opcao);
    });
    
    // Inserir depois da seção Visual
    const secaoVisualElement = document.querySelectorAll('.secao')[3];
    if (secaoVisualElement) {
      secaoVisualElement.insertBefore(container, secaoVisualElement.querySelector('.campo'));
    }
  }
  
  function aplicarTema(key) {
    const tema = temas[key];
    document.getElementById('corPrimaria').value = tema.primaria;
    document.getElementById('corSecundaria').value = tema.secundaria;
    
    // Marcar como ativo
    document.querySelectorAll('.tema-opcao').forEach(el => {
      el.classList.toggle('ativo', el.dataset.tema === key);
    });
    
    // Atualizar preview
    if (window.atualizarPreviewLocal) {
      window.atualizarPreviewLocal();
    }
  }
  
  // Feedback visual ao gerar widget
  const btnGerar = document.querySelector('.btn-gerar');
  const formOriginal = btnGerar?.parentElement;
  
  if (formOriginal && !formOriginal.dataset.enhanced) {
    formOriginal.dataset.enhanced = 'true';
    
    formOriginal.addEventListener('submit', function(e) {
      // Mostrar mensagem de sucesso após gerar
      setTimeout(() => {
        if (window.widgetIdAtual) {
          mostrarMensagemSucesso('Widget gerado com sucesso!');
        }
      }, 1000);
    });
  }
  
  function mostrarMensagemSucesso(texto) {
    const msg = document.createElement('div');
    msg.className = 'success-message';
    msg.textContent = texto;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }
  
  // Melhorar experiência do botão copiar
  window.copiarCodigo = function() {
    const codigo = document.getElementById('codigo').textContent;
    navigator.clipboard.writeText(codigo).then(() => {
      const btn = document.querySelector('.btn-copiar');
      const textoOriginal = btn.textContent;
      btn.textContent = '✓ Copiado!';
      btn.style.background = '#48bb78';
      
      setTimeout(() => {
        btn.textContent = textoOriginal;
        btn.style.background = '';
      }, 2000);
    });
  };
  
  // Timeout visibility toggle
  const checkTimeout = document.getElementById('timeoutHabilitado');
  const campoTimeout = document.getElementById('campoTimeout');
  
  if (checkTimeout && campoTimeout) {
    checkTimeout.addEventListener('change', function() {
      campoTimeout.style.display = this.checked ? 'block' : 'none';
    });
    
    // Definir estado inicial
    campoTimeout.style.display = checkTimeout.checked ? 'block' : 'none';
  }
  
  // Smooth scroll ao clicar nas seções
  document.querySelectorAll('.secao h2').forEach(titulo => {
    titulo.style.cursor = 'pointer';
    titulo.addEventListener('click', function() {
      this.parentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    });
  });
  
  // Adicionar temas após um pequeno delay
  setTimeout(adicionarTemas, 100);
});