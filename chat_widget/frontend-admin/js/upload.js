// Gerenciamento de upload de imagem com compressão
let imagemBase64 = '';

// Função para redimensionar imagem
function redimensionarImagem(file, callback) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const img = new Image();
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Tamanho máximo: 200x200
      const MAX_SIZE = 200;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converter para base64 com compressão JPEG
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% de qualidade
      callback(compressedBase64);
    };
    
    img.src = e.target.result;
  };
  
  reader.readAsDataURL(file);
}

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
  if (checkTimeout && campoTimeout) {
    checkTimeout.addEventListener('change', function() {
      campoTimeout.style.display = this.checked ? 'block' : 'none';
    });
  }
  
  // Clique na área de preview
  if (uploadPreview) {
    uploadPreview.addEventListener('click', function() {
      if (!previewImg.src || previewImg.style.display === 'none') {
        inputFile.click();
      }
    });
  }
  
  // Clique no botão de upload
  if (btnUpload) {
    btnUpload.addEventListener('click', function() {
      inputFile.click();
    });
  }
  
  // Remover imagem
  if (btnRemover) {
    btnRemover.addEventListener('click', function() {
      imagemBase64 = '';
      previewImg.src = '';
      previewImg.style.display = 'none';
      uploadPlaceholder.style.display = 'block';
      btnRemover.style.display = 'none';
      inputFile.value = '';
      if (window.atualizarPreviewLocal) {
        atualizarPreviewLocal();
      }
    });
  }
  
  // Processar arquivo selecionado
  if (inputFile) {
    inputFile.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        // Verificar tamanho do arquivo
        const maxSizeMB = 5;
        if (file.size > maxSizeMB * 1024 * 1024) {
          alert('A imagem é muito grande. Máximo: ' + maxSizeMB + 'MB');
          return;
        }
        
        // Mostrar loading
        if (uploadPlaceholder) {
          uploadPlaceholder.innerHTML = '<p>Processando...</p>';
        }
        
        // Redimensionar e comprimir
        redimensionarImagem(file, function(base64Comprimida) {
          imagemBase64 = base64Comprimida;
          
          if (previewImg) {
            previewImg.src = imagemBase64;
            previewImg.style.display = 'block';
          }
          
          if (uploadPlaceholder) {
            uploadPlaceholder.style.display = 'none';
          }
          
          if (btnRemover) {
            btnRemover.style.display = 'inline-block';
          }
          
          // Restaurar placeholder original
          if (uploadPlaceholder) {
            uploadPlaceholder.innerHTML = `
              <svg viewBox="0 0 24 24" fill="currentColor" style="width:32px;height:32px;opacity:0.5;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              <p>Clique para adicionar</p>
              <small>Recomendado: 100x100px</small>
            `;
          }
          
          if (window.atualizarPreviewLocal) {
            atualizarPreviewLocal();
          }
          
          console.log('Imagem comprimida de', file.size, 'bytes para', base64Comprimida.length, 'caracteres');
        });
      } else {
        alert('Por favor, selecione um arquivo de imagem válido');
      }
    });
  }
});

// Exportar imagem para uso no configurador
function getImagemPerfil() {
  // Retornar imagem comprimida ou avatar padrão
  return imagemBase64 || '';
}