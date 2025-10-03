@echo off
REM backend/setup-clean.bat

echo ====================================
echo   LIMPEZA E CONFIGURACAO DO AMBIENTE
echo ====================================
echo.

echo 1. Limpando variaveis antigas...
REM Limpa variável do usuário
setx GOOGLE_APPLICATION_CREDENTIALS ""
REM Remove da sessão atual
set GOOGLE_APPLICATION_CREDENTIALS=

echo.
echo 2. Verificando arquivos JSON...
echo.

REM Verifica se existe service-account.json
if exist "service-account.json" (
    echo    OK - service-account.json encontrado
    
    REM Cria .env apontando para o arquivo local
    echo PORT=3000> .env
    echo NODE_ENV=development>> .env
    echo GOOGLE_APPLICATION_CREDENTIALS=./service-account.json>> .env
    
    echo    OK - Arquivo .env criado
) else (
    echo    ERRO - service-account.json NAO encontrado!
    echo.
    echo    Voce precisa:
    echo    1. Baixar o arquivo do Google Cloud Console
    echo    2. Salvar como service-account.json nesta pasta
    echo.
    pause
    exit /b 1
)

echo.
echo 3. Testando configuracao...
echo.
node check-env.js

echo.
echo ====================================
echo   CONFIGURACAO CONCLUIDA!
echo ====================================
echo.
echo Agora execute:
echo   node test-iris.js
echo.
pause