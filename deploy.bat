@echo off
rem Deploy do GIPE (Murel) no VPS da Hostinger: empacota o projeto, envia, faz o build de producao e reinicia o app.
rem Uso: deploy.bat   (rode na raiz do projeto; precisa de tar, ssh e scp, que ja vem no Windows 11)

setlocal
set "SERVIDOR=root@187.41.96.17"
set "CHAVE=%USERPROFILE%\.ssh\id_rsa_pessoal"
set "DESTINO=/var/www/gipe"
set "PACOTE=%TEMP%\gipe-deploy.tgz"
set "SSH_OPCOES=-i "%CHAVE%" -o IdentitiesOnly=yes"

cd /d "%~dp0"

if not exist ".env.prod" (
  echo [erro] .env.prod nao encontrado. Ele e enviado junto e define a URL da API.
  exit /b 1
)

echo [1/4] Empacotando o projeto...
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.env.local --exclude=.env.hml --exclude=.env.azl --exclude=docs -czf "%PACOTE%" .
if errorlevel 1 goto erro

echo [2/4] Enviando para o servidor...
scp %SSH_OPCOES% "%PACOTE%" %SERVIDOR%:/tmp/gipe-deploy.tgz
if errorlevel 1 goto erro

echo [3/4] Instalando dependencias e gerando o build de producao (leva alguns minutos)...
ssh %SSH_OPCOES% %SERVIDOR% "set -e; mkdir -p %DESTINO% && tar -xzf /tmp/gipe-deploy.tgz -C %DESTINO% && rm /tmp/gipe-deploy.tgz && cd %DESTINO% && npm ci && npm run build:prod"
if errorlevel 1 goto erro

echo [4/4] Reiniciando o app...
ssh %SSH_OPCOES% %SERVIDOR% "pm2 restart gipe && sleep 4 && curl -s -o /dev/null -w 'status do app: %%{http_code}\n' http://127.0.0.1:3000/"
if errorlevel 1 goto erro

del "%PACOTE%" >nul 2>&1
echo.
echo Deploy concluido: https://www.murel.com.br
exit /b 0

:erro
echo.
echo [erro] O deploy falhou. Veja a mensagem acima e rode o script de novo depois de corrigir.
del "%PACOTE%" >nul 2>&1
exit /b 1
