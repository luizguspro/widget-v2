let widgetIdAtual = null;

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
      imagemPerfil: getImagemPerfil(),
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
      botoesRapidos: document.getElementById('botoesRapidos').value.split('\n').filter(b => b.trim()),
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
  // Detectar se está em localhost ou produção
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isLocal ? window.location.origin : 'https://SEU-DOMINIO.COM';
  
  const codigo = `<!-- Chat Widget - Cole este código antes do </body> -->
<script src="${baseUrl}/widget/widget.js"></script>
<script>
  ChatWidget.inicializar({
    widgetId: '${widgetId}'
  });
</script>`;
  
  document.getElementById('codigo').textContent = codigo;
  document.getElementById('codigoEmbed').style.display = 'block';
  
  // Adicionar nota sobre CORS
  if (!document.getElementById('notaCors')) {
    const nota = document.createElement('div');
    nota.id = 'notaCors';
    nota.style.cssText = 'background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 12px;';
    nota.innerHTML = '<strong>Nota:</strong> Este widget pode ser usado em qualquer site. O servidor está configurado para aceitar requisições de qualquer origem (CORS habilitado).';
    document.getElementById('codigoEmbed').appendChild(nota);
  }
}

function copiarCodigo() {
  const codigo = document.getElementById('codigo').textContent;
  navigator.clipboard.writeText(codigo).then(() => {
    alert('Código copiado! Cole em qualquer site HTML.');
  });
}

// Atualizar preview em tempo real
document.querySelectorAll('input, select, textarea').forEach(campo => {
  campo.addEventListener('input', () => {
    if (widgetIdAtual) {
      atualizarPreviewLocal();
    }
  });
});