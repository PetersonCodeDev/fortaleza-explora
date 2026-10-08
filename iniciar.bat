@echo off
title Fortaleza Explora (servidor ao vivo)
cd /d "%~dp0"
echo.
echo  Iniciando... No celular (mesmo Wi-Fi), abra o endereco "External" que aparecer abaixo.
echo  O navegador abre sozinho em alguns segundos. Para parar, feche esta janela.
echo.
start "" /b cmd /c "timeout /t 12 /nobreak >nul & start http://localhost:5173"
call npm run dev
pause
