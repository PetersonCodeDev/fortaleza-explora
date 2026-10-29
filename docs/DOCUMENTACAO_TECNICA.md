# Fortaleza Explora — Documentação técnica

**Autor:** Pedro Peterson · **Curso:** Ciência da Computação
**Disciplinas:** Desenvolvimento Web (prof. Juvenaldo) e Busca/Recuperação de Informação (prof. Montanha)
**Proposta do professor:** "montar um aplicativo de busca, tipo um Waze sobre o que se tem de interessante aqui em Fortaleza"

---

## 1. Resumo em 30 segundos (para abrir a apresentação)

Fortaleza Explora é um **aplicativo web progressivo (PWA)** que responde "o que faço agora em Fortaleza?". Ele junta **busca inteligente** (tolera erro de digitação, entende intenção e procura no mapa aberto do mundo quando a base local não tem), **mapa e rotas**, **sugestões pela hora, pôr do sol e chuva**, **avisos da comunidade com validade** (ideia do Waze), **roteiro com ordem de visita calculada por algoritmo** e **guia por voz**. É feito **sem framework e sem servidor próprio**: HTML, CSS e JavaScript puros, consumindo APIs abertas, hospedado de graça.

Números: ~2.700 linhas de código (com testes e ferramentas), 65 lugares conferidos (47 com foto real e crédito), 7 roteiros prontos, 8 categorias, 28 testes automatizados, 112 KB de JavaScript próprio.

---

## 2. Problema e diferencial

- **Problema:** quem visita ou mora em Fortaleza não sabe o que fazer *agora* (está aberto? vai chover? vale a pena ir?). Mapas genéricos mostram milhares de resultados e respondem "onde fica", não "o que fazer".
- **Proposta:** busca + contexto. A mesma pergunta tem resposta diferente de manhã, no pôr do sol, na chuva.
- **Diferenciais:** (1) sugestão por contexto (hora/sol/chuva), (2) base curada com "dica local", (3) roteiros prontos e roteiro otimizado, (4) avisos com validade, (5) guia por voz, (6) abre por link, sem cadastro, sem pop-up.

---

## 2.1 Inspirações: o que aprendi com apps do mundo todo

| App (país) | Ideia que me inspirou | Como virou função aqui |
|---|---|---|
| **Waze** (Israel) | Informação da comunidade que vence sozinha: relato com validade e confirmação | **Avisos** de lotado/fechado/evento que somem em 6 h e renovam quando alguém confirma |
| **Citymapper** (Reino Unido) | Mostrar o tempo de todos os modos lado a lado, em vez de escolher um | Rota com **carro, bike e a pé comparados** (6 / 15 / 38 min) numa só tela |
| **Foursquare/Swarm** (EUA) | Check-in com selos e coleção para dar motivo de voltar | **Passaporte**: carimbo por lugar, barras por categoria e 10 selos |
| **Surfline / Windy** | Condição do mar e do vento em linguagem simples | **"Agora no local"**: ondas, água, UV e vento, com conselho prático |
| **PhotoPills / apps de golden hour** | A melhor luz para foto depende da hora do sol | **Luz boa pra foto** e **"saia até 17:04"** para chegar ao pôr do sol |
| **Time Out / Atlas Obscura** | Curadoria editorial em vez de lista infinita | Base curada com **dica local**, fotos e **roteiros prontos** |
| **Google Maps** | Busca por tipo de lugar ("churrascaria"), não só por nome | **Busca por tipo** no OpenStreetMap quando a base local não tem |
| **Guias impressos (Lonely Planet, Michelin)** | Índice limpo, linhas finas, tipografia com personalidade | Visual de **guia de revista**: serifa, linhas finas, inicial em destaque, sem "cartões de IA" |

---

## 3. Arquitetura

Aplicação **cliente (SPA)** em módulos ES, sem back-end. Tudo que é do usuário fica no aparelho.

```
                 ┌────────────────────────── navegador ──────────────────────────┐
  index.html ──► │  app.js (interface, estado, eventos)                           │
                 │     ├─ search.js   motor de busca, Haversine, Levenshtein, 2-opt│
                 │     ├─ agora.js    sol (NOAA), período do dia, chuva, luz boa    │
                 │     ├─ data.js     65 lugares, 8 categorias, 7 roteiros         │
                 │     ├─ icons.js    ícones SVG próprios e marcadores do mapa     │
                 │     ├─ cartao.js   cartão de Stories desenhado em <canvas>      │
                 │     └─ config.js   interruptores do produto (ex.: anúncios)     │
                 │  sw.js (Service Worker)   manifest.webmanifest   localStorage   │
                 └───────────────┬───────────────┬──────────────┬─────────────────┘
                                 │               │              │
                 Tiles OSM (mapa)   OSRM/FOSSGIS (rotas)   Overpass + Nominatim (busca)   Open-Meteo (clima)   Wikimedia Commons (fotos)
```

**Decisão de projeto:** a lógica de busca está em `search.js`/`agora.js`, **módulos puros sem DOM**. Por isso são testados em Node e poderiam rodar num servidor no futuro sem reescrita.

---

## 4. Tecnologias e para que cada uma foi usada

### 4.1 Front-end
| Tecnologia | Uso |
|---|---|
| **HTML5 semântico** | `header`, `nav`, `main`, `aside`, `footer`, `label`, `ul/li`, `details` (passo a passo da rota), `noscript` |
| **CSS3** | Variáveis (`:root`, tema claro/escuro), Flexbox e Grid, `@media` (celular/PC e `prefers-color-scheme`, `prefers-reduced-motion`), `color-mix()`, `:has()`, `content-visibility` (lista rápida), `env(safe-area-inset-bottom)` (iPhone) |
| **JavaScript ES2022** | Módulos (`import/export`), `async/await`, `Promise.allSettled`, `Map/Set`, delegação de eventos, template strings |
| **Sem framework** | Escolha deliberada: ~100 KB de JS, sem build, carrega rápido em 4G; o professor consegue ler tudo |

### 4.2 Bibliotecas de terceiros (hospedadas no próprio projeto, pasta `vendor/`)
| Biblioteca | Versão | Licença | Uso |
|---|---|---|---|
| **Leaflet** | 1.9.4 | BSD-2 | Mapa interativo |
| **Young Serif**, **Atkinson Hyperlegible** e **Caveat** | — | SIL OFL | Títulos em serifa, texto desenhado para legibilidade (Braille Institute) e anotações à mão; subconjunto latino servido localmente |

### 4.3 APIs e dados abertos (todas gratuitas, sem chave)
| Serviço | O que entrega | Como usamos |
|---|---|---|
| **OpenStreetMap** (tiles) | Imagem do mapa | Camada base do Leaflet; atribuição exibida |
| **OSRM / FOSSGIS** `routing.openstreetmap.de` | Rotas | `GET /routed-{car,bike,foot}/route/v1/driving/lon,lat;lon,lat?overview=full&geometries=geojson&steps=true` → linha da rota + passos, que **traduzimos para português no cliente** |
| **Overpass API** | Consulta ao banco do OSM | `POST` com consulta Overpass QL: busca por **tipo** (`cuisine=steak_house`) e por **nome** dentro do retângulo de Fortaleza |
| **Open-Meteo** (previsão) | Clima atual | `current=temperature_2m,precipitation,weather_code` para saber se chove; `uv_index` e `wind_speed_10m` para os detalhes de cada lugar |
| **Open-Meteo Marine** | Condições do mar | `current=wave_height,wave_period,sea_surface_temperature` (altura e período das ondas, temperatura da água) nas praias |
| **Wikipédia / Wikimedia Commons** | Fotos reais dos lugares | Script `ferramentas/gerar-fotos.mjs` consulta a API e grava `js/fotos.js` com a foto e o link do artigo (crédito exibido no app) |

### 4.4 APIs do navegador (Web APIs)
| API | Uso |
|---|---|
| **Geolocation** (`getCurrentPosition`, `watchPosition`) | "Perto de mim" e "Guia ao vivo" |
| **Service Worker + Cache API** | App funciona offline; cache de mapa limitado a 400 tiles |
| **Web App Manifest** | Instalável na tela inicial (ícones PNG 192/512 e maskable) |
| **Web Speech — síntese** (`speechSynthesis`) | Narração dos lugares e guia ao vivo |
| **Web Speech — reconhecimento** (`SpeechRecognition`) | Busca por voz |
| **Canvas 2D** | Gera o cartão do roteiro (1080×1920) para Stories |
| **Web Share API** | Compartilha o cartão e o link do lugar |
| **Pointer Events** | Gaveta da lista que acompanha o dedo |
| **Intl.DateTimeFormat** | Relógio no fuso `America/Fortaleza` |
| **localStorage** | Favoritos, roteiro, avisos, tema (nada sai do aparelho) |

### 4.5 Infraestrutura e qualidade
| Item | Uso |
|---|---|
| **GitHub Pages + GitHub Actions** | Hospedagem gratuita; a cada envio roda os testes, gera as páginas e publica |
| **Node.js `node:test`** | 28 testes automatizados, sem dependências |
| **browser-sync** (só em desenvolvimento) | Recarrega o celular sozinho quando o código muda |
| **Schema.org JSON-LD** | Dados estruturados em cada página de lugar (SEO) |

---

## 5. Busca e recuperação de informação (disciplina do prof. Montanha)

Implementada em `js/search.js`.

1. **Normalização:** Unicode NFD + remoção de diacríticos + caixa baixa. "Praça" = "praca".
2. **Consulta com vários termos em AND:** todos os termos precisam casar.
3. **Ranking ponderado por campo** (modelo próprio inspirado em TF com pesos): nome com prefixo 10 > nome 8 > categoria/tag exata 6 > bairro 5 > tag parcial 4 > descrição 2. A pontuação de cada termo é somada.
4. **Expansão da consulta por sinônimos** (dicionário de intenções, peso 0,6). "comer" → gastronomia, restaurante, tapioca, peixe.
5. **Tolerância a erro de digitação:** distância de **Levenshtein** (programação dinâmica, O(n·m)), limite 1 para palavras curtas e 2 para palavras de 7+ letras. "mercdo" acha "Mercado".
6. **Desempate** por nota e proximidade (**Haversine**, fórmula da distância na esfera).
7. **Filtros:** categoria, raio, "aberto agora" (com virada de meia-noite), grátis, e um filtro por predicado usado pelo "Agora".
8. **Autocompletar** com *debounce* de 120 ms.
9. **Busca híbrida (local → mundo):** se a base curada não tem resultado, o app consulta o OpenStreetMap em toda Fortaleza.
   - **Tipo antes de nome:** para termos que são *tipos* de lugar ("churrascaria", "pizzaria"), primeiro traz quem **é** daquele tipo (tag `cuisine`) e dá **bônus de relevância**; depois quem tem o nome parecido, **só entre restaurantes** (evita "Duty Free do Churrasco").
   - **Radical simples** (*stemming* mínimo): "churrasco" e "churrascaria" viram "churrasc".
   - **Resiliência:** **duas fontes em paralelo**: Overpass (por tipo e por nome) e Nominatim (busca por texto). Cada resposta entra na lista **assim que chega** (`Promise.allSettled`), então o servidor lento não segura o que já veio. O resultado fica **guardado por 24 h** no aparelho: repetir a busca é instantâneo e funciona até sem internet.
   - Aprendizado técnico: o Overpass devolve erro 504 para expressões regulares complexas (classes de acento); a solução foi usar texto simples e igualdades de tag.
10. **Avaliação (próximo passo acadêmico):** rotular ~30 consultas e medir precisão@k e MRR.

**Limitação:** a busca local é sequencial O(N), adequada para centenas de lugares. Para milhares seria preciso índice invertido (BM25, MiniSearch).

### 5.1 Roteiro (problema do caixeiro viajante, heurístico)
`montarRoteiro()`: **vizinho mais próximo** (guloso, O(n²)) seguido de **2-opt** (inverte trechos enquanto o percurso diminui, até não melhorar). Não garante o ótimo global, mas para dezenas de paradas é rápido e bom. Testado: nunca é pior que a ordem original.

---

## 6. "Agora": contexto em tempo real (`js/agora.js`)

- **Pôr e nascer do sol calculados no aparelho** pelo algoritmo simplificado da **NOAA** (equação do tempo, declinação solar, ângulo horário). Sem API, funciona offline. Erro típico de ~2 min.
- **Períodos do dia:** madrugada, manhã, almoço, tarde, **pôr do sol** (de 75 min antes a 20 min depois), noite.
- **Chuva:** `precipitation > 0,1` ou códigos WMO de chuva/pancada/trovoada (51–67, 80–99) vindos da Open-Meteo.
- **Sugestão** = período + chuva → um predicado que filtra a lista. Chuva leva a lugares cobertos; pôr do sol, a mirantes.
- **Luz dourada para foto:** 50 min após o nascer e 50 min antes do pôr do sol.
- **Fuso:** todo horário usa `America/Fortaleza` (UTC-3, sem horário de verão). Um turista com o celular em outro fuso ainda vê "Aberto/Fechado" corretos.

### 6.1 Condições no local, rotas comparadas e "saia até"
- **Condições** (`js/condicoes.js`, módulo puro): converte as respostas das APIs em níveis legíveis (UV baixo/alto, vento fraco/forte, mar calmo/agitado) e em **conselhos por regra clara** (ex.: UV ≥ 6 → protetor; ondas ≥ 1,8 m → cuidado com crianças). Não inventa nada: se a API não responde, o bloco não aparece.
- **Rotas comparadas:** as três rotas (carro, bike, a pé) são pedidas **em paralelo** (`Promise.allSettled`), guardadas em cache por origem/destino e mostradas lado a lado; trocar de modo não refaz a chamada.
- **"Saia até":** para lugares de pôr do sol, `saiaAte()` calcula `pôr do sol − 15 min − duração da rota` e avisa se já não dá tempo.

### 6.2 Passaporte (`js/passaporte.js`, módulo puro)
Estado = objeto `{idDoLugar: instante}` no `localStorage`. `resumoPassaporte()` calcula totais por categoria e quais dos 10 selos foram conquistados (regras como "3 praias", "20 lugares"); `selosNovos()` compara antes/depois para avisar "Novo selo!". O ângulo de cada carimbo é derivado do id (hash), então parece batido à mão mas **não muda** a cada abertura.

---

## 7. Front-end e design

- **Identidade própria:** paleta de papel quente, verde-mar e laranja-sol (referência à cidade); tipografia serifada "de revista" nos títulos. Evitou-se o visual genérico de IA (degradê roxo, emojis, "quadradinhos de ícone", cartões arredondados iguais).
- **Linguagem de guia impresso:** a lista é um **índice com linhas finas** (não cartões); cada lugar tem **foto real** (ou, sem foto, a **inicial do nome em serifa** sobre fundo hachurado); categorias em texto pequeno e colorido; filtros como texto com sublinhado, não "pílulas". Textura sutil de papel no tema claro.
- **Elementos desenhados à mão (SVG):** logo (sol e ondas), **jangada** nos estados vazios, **carimbos** do passaporte; textos em tom local ("Bora tentar outra palavra?").
- **Ícones SVG desenhados à mão** (`icons.js`), em traço único, em vez de emoji (mesma aparência em qualquer aparelho). Os marcadores do mapa são SVG em gota, na cor da categoria.
- **Tema claro/escuro** por variáveis CSS, seguindo o sistema do usuário e lembrando a escolha; o tema é aplicado antes de pintar a página (sem "piscada").
- **Menos poluição visual:** nenhum pop-up modal. Detalhe, rota e aviso abrem num painel único; o app **não pede localização ao abrir**; botões flutuantes só aparecem quando fazem sentido.
- **Gaveta de 3 posições (celular):** mínimo, meio, alto. O painel **acompanha o dedo** (Pointer Events), encaixa na posição mais próxima ao soltar e aceita "arremesso" (velocidade > 0,5 px/ms). No PC, um botão esconde a lista para liberar o mapa.
- **Acessibilidade:** `aria-label`, `aria-pressed`, `aria-live`, foco visível, navegação por teclado (Enter/Esc), alvos de toque ≥ 38 px, `prefers-reduced-motion`.
- **Responsivo:** mobile-first, PC com painel lateral de 400 px.

---

## 8. PWA e funcionamento offline

- **Manifest** com ícones 192/512 e *maskable*, `display: standalone`, cores do tema. Botão discreto "Instalar como aplicativo" (evento `beforeinstallprompt`) e dica para iPhone.
- **Service Worker** com duas estratégias:
  - *Rede primeiro, cache de reserva* para o código do app (o usuário sempre vê a versão nova; sem internet, usa a guardada).
  - *Cache primeiro + atualização em segundo plano* para mapa e fontes, com limite de 400 tiles.
  - APIs ao vivo (rotas, Overpass, clima) nunca passam pelo cache.

---

## 9. Segurança e privacidade

- **XSS:** todo texto de usuário ou do OpenStreetMap passa por `esc()` antes de entrar no DOM; links externos com `rel="noopener"`.
- **Sem cadastro e sem servidor de dados:** favoritos, roteiro e avisos ficam só no aparelho.
- **Fontes e bibliotecas hospedadas no próprio site:** nenhuma requisição ao Google Fonts ou a CDN (mais rápido, funciona offline e não expõe o IP do usuário).
- **Localização:** pedida só quando o usuário toca no botão; usada no aparelho, nunca enviada.
- **LGPD:** como não há coleta, não há tratamento de dados pessoais hoje. Ao incluir anúncios ou *analytics*, será preciso política de privacidade e aviso de cookies.

---

## 10. Desempenho

- Sem framework e sem build: 112 KB de JavaScript próprio.
- **Marcadores atualizados por diferença** (só adiciona/remove o que mudou, sem redesenhar todos).
- Lista paginada (40 por vez) e `content-visibility: auto` nos cards.
- *Debounce* na digitação; consultas online em paralelo e com cache por termo.
- Delegação de eventos (um *listener* por lista, não por card).

---

## 11. Qualidade: testes

`npm test` roda **28 testes** (`node:test`) cobrindo: normalização, Haversine, Levenshtein, busca (acento, erro de digitação, sinônimos, AND), filtros, raio e ordenação, horário (24 h, dias, **virada de meia-noite**), roteiro (2-opt nunca pior), sugestões, integridade dos dados, **pôr/nascer do sol em todos os meses**, períodos do dia, chuva, luz dourada e validade dos roteiros prontos.

Os testes cobrem também níveis de UV/vento/onda, conselhos, selos do passaporte, ângulo e nome curto do carimbo. Eles usam instantes explícitos em UTC-3, então **passam igual em qualquer fuso** (conferido com `TZ=UTC`, que é o do servidor do GitHub). O GitHub Actions roda os testes antes de cada publicação: se um falhar, a versão antiga continua no ar.

---

## 12. Publicação e SEO

- **GitHub Pages** via GitHub Actions (`.github/workflows/pages.yml`): testa → gera páginas → publica. Passo a passo em `docs/HOSPEDAR.md`.
- **Páginas estáticas por lugar** (`ferramentas/gerar-paginas.mjs`): 65 páginas com título, descrição, Open Graph e **JSON-LD (Schema.org `TouristAttraction`)**, mais `sitemap.xml` e `robots.txt`. Objetivo: o Google encontrar "o que fazer em Fortaleza".

---

## 13. Decisões e trade-offs

| Decisão | Por quê | Custo |
|---|---|---|
| Sem back-end | Zero custo, publicação simples, privacidade | Avisos não são compartilhados entre pessoas |
| Sem framework | Leve, legível, sem build | Mais código manual de interface |
| OpenStreetMap em vez de Google Maps | Gratuito, sem chave, dados abertos | Servidores públicos com limite de uso e qualidade de dados irregular |
| Base curada pequena + busca no OSM | Qualidade nos lugares principais, cobertura no resto | Lugares do OSM não têm dica nem horário revisado |
| Sol calculado no aparelho | Funciona offline, sem API | Precisão de alguns minutos |

---

## 14. Limitações (para falar com franqueza)

- **Dados da base:** as **posições foram conferidas** contra o OpenStreetMap e a Wikipédia (duas fontes independentes; minhas estimativas iniciais erravam até 1,6 km). Os **horários continuam estimados** e aparecem como "horário estimado: confirme no local". As descrições seguem os artigos da Wikipédia; o que não consegui confirmar (um aquário, uma roda-gigante e uma tapiocaria genérica) foi **retirado**.
- **Fotos:** 31 dos 65 lugares têm foto livre do Wikimedia Commons; o app mostra **autor, licença e link** do arquivo em cada uma. Foram conferidas visualmente e descartadas as que traziam logotipo, mapa ou o lugar errado (a conferência pegou, por exemplo, um forte em Portugal no lugar da Fortaleza de Nossa Senhora da Assunção). Cinco lugares ficam sem foto por falta de imagem livre adequada.
- **Condições do mar** vêm de modelo meteorológico (grade de ~5 km), não de sensor na praia: são uma estimativa.
- **Avisos da comunidade** ficam no aparelho de quem os cria; para valerem entre usuários é preciso um servidor e moderação.
- **Serviços públicos gratuitos** (tiles, rotas, Overpass) têm política de uso justo e às vezes dão erro 504; o app mostra aviso e plano B (linha reta). Em produção com muito uso será preciso contratar provedor (MapTiler, Mapbox, Stadia) ou hospedar o próprio.
- **GPS e instalação** exigem HTTPS (ou localhost); por `http://192.168…` na rede local não funcionam.
- **Voz:** a busca por voz depende do navegador (Chrome, Edge e Android).
- **Não testado:** em celular físico e em iPhone/Safari; narração, busca por voz e "Guia ao vivo" em aparelho real; o deploy no GitHub Pages ainda não foi realizado. Os testes automáticos cobrem a lógica, não a interface.

---

## 15. Trabalhos futuros

- Back-end (Node + PostgreSQL/PostGIS) para avisos compartilhados, login e moderação.
- Índice invertido/BM25 e busca semântica; avaliação com precisão@k e MRR.
- Preço real em R$ e filtros de acessibilidade (dados conferidos), ofertas de comércio local.
- Inglês e espanhol; agenda real de eventos; transporte público.
- Medição de uso sem cookies (Plausible/Umami).

---

## 15.1 Roteiro de demonstração (uns 4 minutos, ao vivo)

Teste tudo uma vez antes, com internet. Se a rede da sala for ruim, mostre primeiro o que funciona sem rede.

1. **Contexto:** abra o app. Aponte o botão laranja do topo ("Tarde de praia e passeio", "Pôr do sol às 17:26"...) e a temperatura: "o app muda a sugestão conforme hora, sol e chuva".
2. **Busca com erro:** digite `mercdo` → acha o Mercado Central. Digite `comer` → entende a intenção.
3. **Busca que vai além da base:** digite `churrascaria` → como não tem na base, procura em Fortaleza no OpenStreetMap e traz churrascarias de verdade (pode levar até uns 20 s; avise a turma).
4. **Detalhe e rota:** abra a Ponte dos Ingleses → mostre a foto, o horário, a dica local e a "luz boa pra foto hoje". Toque em **Carro** → mostre os **três tempos lado a lado** e o **"saia até…"** do pôr do sol. Depois abra a **Praia do Meireles** e mostre **"Agora no local"** (mar, UV, vento).
5. **Narração:** toque em **Ouvir** (o navegador lê o lugar em voz alta).
6. **Roteiro:** aba Roteiro → "Usar este roteiro" (Centro histórico a pé) → o app mostra a melhor ordem e a distância → **Cartão pra Stories**.
7. **Passaporte:** toque em "Já fui aqui" em 2 ou 3 lugares → aba Passaporte → mostre os carimbos, as barras e o selo conquistado.
8. **Avisos:** botão laranja do mapa → toque no mapa → publique "Lotado" → mostre que some em 6 h e que dá para confirmar.
9. **Celular:** abra no celular, arraste a barra de baixo para minimizar e ver o mapa; mostre o tema escuro e "Instalar como aplicativo".
10. **Código:** abra `js/search.js` e mostre `levenshtein()`, `score()` e `montarRoteiro()`; depois `npm test` com os 28 testes passando.

**Plano B se a internet cair:** o app abre e a base local, a busca e o roteiro funcionam; só mapa novo, rotas, clima e busca online dependem da rede.

---

## 16. Perguntas que o professor pode fazer (e respostas curtas)

- **"Por que não usou React?"** O escopo cabe em módulos nativos; ficou com ~100 KB, sem build, e eu domino cada linha. Se crescer, a lógica pura já está separada para migrar.
- **"De onde vêm os dados?"** Base curada (65 lugares conferidos) + OpenStreetMap via Overpass. Rotas pelo OSRM, clima pela Open-Meteo, mapa pelo OSM.
- **"Como funciona o ranking?"** Pontuação por campo com pesos, expansão por sinônimos, tolerância a erro com Levenshtein e desempate por nota e distância (Haversine).
- **"E se o servidor de rotas cair?"** Plano B: linha reta com estimativa de tempo, avisando o usuário.
- **"Funciona offline?"** A base local, a interface e o cálculo do sol sim; mapa novo, rotas, clima e busca online precisam de internet.
- **"Como garante que não quebra?"** 28 testes automáticos rodam a cada publicação.
- **"Qual a complexidade do roteiro?"** Vizinho mais próximo O(n²) e 2-opt; heurística, não ótimo exato (o problema é NP-difícil).
- **"E a privacidade?"** Nada é enviado a servidor próprio; localização só por ação do usuário; fontes e bibliotecas locais.

---

## 17. Créditos e licenças

Dados do mapa © colaboradores do **OpenStreetMap** (ODbL) · **Leaflet** (BSD-2) · **OSRM** (BSD-2) · **Open-Meteo** (CC BY 4.0, atribuição no rodapé) · **Fraunces** e **Instrument Sans** (SIL OFL) · Código do projeto: MIT.

## 18. Ferramentas usadas no desenvolvimento

_(Preencher conforme a regra da disciplina sobre uso de ferramentas de apoio. Este projeto foi desenvolvido com auxílio de um assistente de programação de IA (Claude Code), com revisão e testes do autor. Descreva aqui o que você escreveu, o que foi apoiado pela ferramenta e como validou.)_

---

## 19. Atualização de 28/10/2026: celular mais rápido e acessibilidade

**Desempenho no celular (medido, não suposto).** Uma pessoa relatou que o app travava no celular. Criei `ferramentas/desempenho.mjs`, que abre o app num celular simulado (tela de 390 px e CPU 4x mais lenta) e mede o tempo de cada quadro durante três gestos: arrastar a gaveta, arrastar o mapa e rolar a lista.
- **Causa principal:** a gaveta mudava de altura a cada quadro, forçando o navegador a recalcular o layout da página inteira (1.700 elementos). Cerca de 30% dos quadros travavam.
- **Correção:** a gaveta passou a ter altura fixa e a subir e descer por `transform`, que a placa de vídeo faz sem recalcular o layout. Resultado: 0 a 4% dos quadros lentos, com média de 17 ms (60 por segundo).
- **Outras correções:** o app desenha só a aba que está aberta (o passaporte refazia 65 carimbos em SVG a cada toque); abrir um lugar troca só o destaque em vez de refazer a lista; as miniaturas da lista usam a foto de 250 px (~22 KB) em vez de 960 px (~200 KB); a sombra dos pins foi desenhada no próprio SVG (sem filtro CSS); no celular o mapa fica sem filtro de cor e sem textura de papel.
- **Limite honesto:** a medição é em computador com CPU reduzida. O custo real na placa de vídeo de cada aparelho só se confirma testando no celular.

**Acessibilidade.** Sugestão recebida: indicar restaurantes e outros lugares com estrutura para pessoas com deficiência, a partir de comentários de outras pessoas. O OpenStreetMap já guarda esse dado de forma colaborativa (tag `wheelchair`). `ferramentas/acessibilidade-osm.mjs` consulta o dado de cada lugar da base: **10 de 65** têm informação (todos "acessível"); os outros ficam como "sem informação ainda", nunca inventada. No app: selo "Acessível" nos cards, bloco "Acessibilidade" no detalhe, filtro "Acessível" e um link para qualquer pessoa completar ou corrigir o dado no OpenStreetMap. Lugares achados pela busca online também trazem a tag quando existe.
- **O que falta para ter comentários dentro do app:** um servidor (banco de dados) para guardar e compartilhar os relatos entre pessoas, com moderação. Sem servidor, comentários ficariam só no aparelho de quem os escreveu. Caminho sugerido: banco gratuito (por exemplo Supabase) acessado direto pelo navegador, com limite de envios e moderação antes de publicar.

---

## 20. Atualização de 29/10/2026: marcadores, agenda de eventos e guia visual

**Marcadores do mapa ("selos").** Os pins genéricos foram trocados por selos recortados, a mesma forma do carimbo do passaporte. Cada categoria tem um símbolo próprio tirado da cidade: jangada (praias), muralha e portão (história), máscara de teatro (cultura), caju (gastronomia), carnaúba (natureza), pipa de kitesurf (lazer), lua e estrela (noite), sacola (compras). O centro do selo é a posição exata do lugar. Três estados: normal, aberto (maior, com aro laranja) e visitado (bolinha com check). Os símbolos ficam em `js/icons.js` (`glifoPaths`, `seloSvg`) e o mesmo desenho aparece no carimbo, então marcador e passaporte combinam.

**Agenda de eventos (nova aba).** Fica em `js/agenda.js` (funções puras: data de Fortaleza, estado do evento, ordenação, evento em destaque, arquivo `.ics`) e `js/eventos.js` (os dados). Decisões:
- **Só entra o que foi conferido numa fonte.** Não existe API aberta e gratuita de eventos de Fortaleza, então a lista é curada à mão: Cine Ceará (7 a 13/11/2026), Réveillon (31/12), Carnaval 2027 (6 a 9/02) e Ceará Natal de Luz (datas de 2026 ainda sem divulgação, por isso aparece em "datas a confirmar"). Eventos que não consegui confirmar (como Fortal e festas juninas) ficaram de fora de propósito: é melhor ter pouco e certo do que muito e errado.
- **Agenda ao vivo.** Para shows e festas que mudam toda semana, a aba leva a Sympla, O Povo e Diário do Nordeste (links testados).
- **Aviso no topo da lista** quando há evento confirmado rolando ou começando em até 21 dias.
- **Adicionar ao calendário:** gera um `.ics` no próprio aparelho, sem servidor. O último dia do evento entra certo (no formato `.ics` o fim é exclusivo) e as linhas longas são quebradas em 75 bytes sem cortar caracteres escapados. Dois erros desse tipo apareceram nos testes e foram corrigidos.
- **Fuso:** "hoje" é sempre calculado no horário de Fortaleza, não no do aparelho. Testado também com `TZ=UTC`.
- **Como manter:** copiar um bloco de `js/eventos.js`, trocar datas e `id`, rodar `npm test` (ele confere datas, links e se os lugares existem).

**Guia visual** (`design/guia.html`, link no repositório): página gerada pelo próprio código do app, com marcadores nos 4 estados, carimbos, paleta, tipografia, ilustração e componentes. Serve de apoio para a equipe de design, porque sempre mostra o que está no ar.

**Testes e desempenho.** 40 testes (`npm test`), com 10 novos para a agenda. A medição de desempenho (`ferramentas/desempenho.mjs`, CPU 4x mais lenta) continua em 17 ms por quadro, com quase nenhum quadro lento, depois de cinco abas e selos novos. Limite honesto: não foi testado em celulares reais nem em iPhone.
