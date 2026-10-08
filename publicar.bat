@echo off
chcp 65001 >nul
title Publicar Fortaleza Explora
cd /d "%~dp0"
echo.
echo  PUBLICAR NA INTERNET (GitHub Pages, gratis)
echo  Antes: crie um repositorio VAZIO e PUBLICO em https://github.com/new com o nome fortaleza-explora
echo.
where git >nul 2>nul || (echo  Git nao encontrado. Instale em https://git-scm.com e rode de novo. & pause & exit /b 1)
if not exist .git (
  git init -b main
)
git add -A
git commit -m "Fortaleza Explora" 2>nul
set /p REPO=" Cole o endereco do repositorio (ex.: https://github.com/SEU-USUARIO/fortaleza-explora.git): "
git remote remove origin 2>nul
git remote add origin %REPO%
git push -u origin main
echo.
echo  Pronto o envio. Agora, UMA vez so, no GitHub: Settings ^> Pages ^> Source: "GitHub Actions".
echo  O endereco do app sera: https://SEU-USUARIO.github.io/fortaleza-explora/
echo  Para atualizar depois, rode este arquivo de novo (ele reenvia as mudancas).
pause
