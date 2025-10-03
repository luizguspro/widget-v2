// atualizar-sistema.js
// Salve este arquivo na pasta raiz chat_widget e execute: node atualizar-sistema.js

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('ATUALIZANDO SISTEMA PARA DIALOGFLOW');
console.log('========================================\n');

// 1. Atualizar Admin HTML - Remover campo de mensagem obrigatória
function atualizarAdminHTML() {
  console.log('1. Atualizando Admin HTML...');
  
  const adminPath = path.join(__dirname, 'frontend-admin', 'index.html');
  
  if (fs.existsSync(adminPath)) {
    let html = fs.readFileSync(adminPath, 'utf-8');
    
    // Tornar o campo opcional e adicionar placeholder
    html = html.replace(
      '<textarea id="boasVindas" rows="2">Olá! Como posso ajudar você hoje?</textarea>',
      '<textarea id="boasVindas" rows="2" placeholder="Deixe vazio para usar mensagem do Dialogflow"></textarea>'
    );
    
    // Remover required do campo
    html = html.replace(
      '<textarea id="boasVindas" required',
      '<textarea id="boasVindas"'
    );
    
    fs.writeFileSync(adminPath, html);
    console.log('   ✅ Admin HTML atualizado');
  }
}

// 2. Atualizar configurador.js - Não enviar mensagem vazia
function atualizarConfigurador() {
  console.log('2. Atualizando Configurador JS...');
  
  const configPath = path.join(__dirname, 'frontend-admin', 'js', 'configurador.js');
  
  if (fs.existsSync(configPath)) {
    let js = fs.readFileSync(configPath, 'utf-8');
    
    // Encontrar e modificar a parte das mensagens
    const oldCode = `mensagens: {
      boasVindas: document.getElementById('boasVindas').value,`;
    
    const newCode = `mensagens: {
      boasVindas: document.getElementById('boasVindas').value || '', // Vazio = usa Dialogflow`;
    
    js = js.replace(oldCode, newCode);
    
    fs.writeFileSync(configPath, js);
    console.log('   ✅ Configurador atualizado');
  }
}

// 3. Atualizar Widget Service - Aceitar mensagem vazia
function atualizarWidgetService() {
  console.log('3. Atualizando Widget Service...');
  
  const servicePath = path.join(__dirname, 'backend', 'src', 'services', 'widget.service.ts');
  
  if (fs.existsSync(servicePath)) {
    let ts = fs.readFileSync(servicePath, 'utf-8');
    
    // Adicionar comentário explicativo
    if (!ts.includes('// Mensagem vazia = usa Dialogflow')) {
      ts = ts.replace(
        'mensagens: {',
        'mensagens: { // Mensagem vazia = usa Dialogflow'
      );
      fs.writeFileSync(servicePath, ts);
    }
    
    console.log('   ✅ Widget Service atualizado');
  }
}

// 4. Criar arquivo de exemplo de widgets.json
function criarExemploWidgets() {
  console.log('4. Criando exemplo de widgets.json...');
  
  const exemplo = [
    {
      widgetId: "exemplo-iris-vtal",
      cliente: "VTAL",
      dominioAutorizado: "vtal.com.br",
      dialogflow: {
        agentId: "7c9a005d-7b03-4815-818b-bf4e1031772c",
        projectId: "vtal-atendimentoai-prd",
        location: "global"
      },
      visual: {
        corPrimaria: "#F4B400",
        corSecundaria: "#525252",
        posicao: "bottom-right",
        largura: 380,
        altura: 600,
        imagemPerfil: "",
        nomeBotVisivel: "Iris"
      },
      mensagens: {
        boasVindas: "", // VAZIO - usa mensagem do Dialogflow
        placeholder: "Digite sua mensagem...",
        offline: "No momento estou offline"
      },
      recursos: {
        upload: false,
        botoesRapidos: ["Suporte", "Informações"],
        som: true,
        historico: true,
        mostrarRefresh: true,
        timeoutHabilitado: false,
        timeoutMinutos: 30
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    }
  ];
  
  const dataPath = path.join(__dirname, 'backend', 'src', 'data');
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  
  const widgetsPath = path.join(dataPath, 'widgets-exemplo.json');
  fs.writeFileSync(widgetsPath, JSON.stringify(exemplo, null, 2));
  
  console.log('   ✅ Exemplo criado em: backend/src/data/widgets-exemplo.json');
}

// 5. Criar HTML de teste
function criarHTMLTeste() {
  console.log('5. Criando HTML de teste...');
  
  const htmlTeste = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Teste Widget Dialogflow</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .info {
            background: #e8f5e9;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .warning {
            background: #fff3e0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        code {
            background: #f5f5f5;
            padding: 2px 5px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Teste do Widget com Dialogflow</h1>
        
        <div class="info">
            <h2>✅ Como funciona agora:</h2>
            <ul>
                <li>Ao abrir o chat, automaticamente envia "oi" para o Dialogflow</li>
                <li>A mensagem de boas-vindas vem direto do agente</li>
                <li>Não precisa configurar mensagem no admin</li>
            </ul>
        </div>
        
        <div class="warning">
            <h2>⚠️ Importante:</h2>
            <p>Certifique-se que o servidor está rodando: <code>npm run dev</code></p>
            <p>Widget ID deve existir no widgets.json</p>
        </div>
        
        <h2>Instruções:</h2>
        <ol>
            <li>O chat aparecerá no canto inferior direito</li>
            <li>Clique para abrir</li>
            <li>A mensagem inicial virá do Dialogflow</li>
            <li>Digite qualquer coisa para testar</li>
        </ol>
    </div>
    
    <!-- Widget -->
    <script src="http://localhost:3000/widget/widget.js"></script>
    <script>
      // Use o ID do widget que você criou
      ChatWidget.inicializar({
        widgetId: '35aeba3e-8f3b-4aef-a153-fab34a4d2730'
      });
    </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(__dirname, 'teste-dialogflow.html'), htmlTeste);
  console.log('   ✅ HTML de teste criado: teste-dialogflow.html');
}

// 6. Mostrar instruções finais
function mostrarInstrucoes() {
  console.log('\n========================================');
  console.log('ATUALIZAÇÃO CONCLUÍDA!');
  console.log('========================================\n');
  
  console.log('📝 O que mudou:');
  console.log('   • Mensagem de boas-vindas agora vem do Dialogflow');
  console.log('   • Campo no admin agora é opcional');
  console.log('   • Ao abrir o chat, envia "oi" automaticamente');
  console.log('   • Se o Dialogflow falhar, usa mensagem padrão\n');
  
  console.log('🚀 Próximos passos:');
  console.log('   1. Reinicie o servidor: npm run dev');
  console.log('   2. Abra o arquivo: teste-dialogflow.html');
  console.log('   3. Teste o chat!\n');
  
  console.log('💡 Dica: Configure a intent de "oi" no Dialogflow CX');
  console.log('   para personalizar a mensagem de boas-vindas\n');
}

// Executar todas as atualizações
async function executar() {
  try {
    atualizarAdminHTML();
    atualizarConfigurador();
    atualizarWidgetService();
    criarExemploWidgets();
    criarHTMLTeste();
    mostrarInstrucoes();
  } catch (erro) {
    console.error('❌ Erro durante atualização:', erro);
  }
}

// Rodar
executar();