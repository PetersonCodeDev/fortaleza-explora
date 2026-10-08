# Colocar o app na internet (grátis) e baixar no celular

O app é só arquivos estáticos (sem servidor, sem banco), então qualquer hospedagem gratuita serve. Todas já entregam **HTTPS**, o que libera GPS e instalação como aplicativo no celular.

## Opção A — GitHub Pages (recomendada, também serve como portfólio)

1. Crie uma conta em github.com (se não tiver) e um repositório **público** vazio chamado `fortaleza-explora`: https://github.com/new
2. Dê dois cliques em `publicar.bat`, cole o endereço do repositório e confirme o login do GitHub se pedir.
3. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions** (só na primeira vez).
4. Em ~1 minuto o app está em `https://SEU-USUARIO.github.io/fortaleza-explora/`.
5. Para atualizar depois: rode o `publicar.bat` de novo. O GitHub roda os testes antes de publicar; se algum falhar, a versão antiga continua no ar.

## Opção B — Netlify Drop (mais rápido, sem Git)

1. Acesse https://app.netlify.com/drop e arraste a pasta `fortaleza-explora` inteira.
2. Crie a conta gratuita para o site não expirar. Você recebe um endereço `*.netlify.app` e pode trocar o nome em Site settings.

## Opção C — Cloudflare Pages

Conecte o repositório do GitHub em pages.cloudflare.com (build command vazio, pasta de saída `/`). Banda ilimitada no plano gratuito.

## Domínio próprio (opcional, quando for monetizar)

Registre um `.com.br` (~R$ 40/ano) e aponte para a hospedagem escolhida (as três aceitam domínio próprio de graça, com HTTPS automático).

## Baixar (instalar) no celular

- **Android (Chrome):** abra o endereço do app → menu ⋮ → **Instalar app** (ou o botão “Instalar como aplicativo” no rodapé da lista).
- **iPhone (Safari):** abra o endereço → **Compartilhar** → **Adicionar à Tela de Início**.
- **Computador (Chrome/Edge):** ícone de instalar na barra de endereço.

Depois de instalado, abre em tela cheia, com o ícone do app, e a base de lugares funciona sem internet (mapa e rotas precisam de internet).

## Limites dos planos gratuitos (para ficar tranquilo)

GitHub Pages: 100 GB de tráfego/mês, 1 GB de site. Netlify: 100 GB/mês. Para um app deste tamanho (~1 MB) isso são centenas de milhares de acessos.
Os serviços de mapa usados (OpenStreetMap, OSRM, Overpass, Open-Meteo) são públicos e gratuitos, **mas com política de uso justo**: se o app crescer muito, será preciso contratar um provedor de mapas/rotas (Mapbox, MapTiler, Stadia) ou hospedar o próprio.
