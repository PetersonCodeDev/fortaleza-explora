# 🧭 Fortaleza Explora

Aplicativo web (PWA, funciona no celular e no computador) para **descobrir o que há de interessante em Fortaleza**, no estilo Waze: busca inteligente, mapa, rotas, relatos da comunidade e roteiro de passeio.

Projeto integrado de duas disciplinas:
- **Desenvolvimento Web** (prof. Juvenaldo): aplicativo web responsivo, PWA, consumo de APIs.
- **Busca / Recuperação de Informação** (prof. "Montanha"): "montar um aplicativo de busca, tipo um Waze sobre o que se tem de interessante em Fortaleza".

## Como rodar

Não precisa instalar nada além de um servidor estático (o app é HTML + JS puro, sem build).

```bash
cd fortaleza-explora
python -m http.server 5173      # ou: npm start
# abra http://localhost:5173
```

Testes automáticos da busca (Node 20+):

```bash
npm test
```

> Geolocalização e instalação como app exigem `localhost` ou HTTPS. Para publicar: GitHub Pages / Netlify / Vercel (é só enviar a pasta).

## Funcionalidades

| Recurso | Como funciona |
|---|---|
| Busca inteligente | Ignora acento e maiúscula, tolera erro de digitação, entende sinônimos ("comer" → gastronomia), autocompletar |
| Filtros | Categoria, raio em km, "abertos agora", "grátis", ordenar por relevância / distância / nota |
| Mapa | Leaflet + OpenStreetMap, pins por categoria |
| Rotas | Carro, a pé ou bicicleta, com passo a passo em português (OSRM / FOSSGIS). Atalhos para Waze e Google Maps |
| Perto de mim | Geolocalização, distância em cada card |
| Relatos colaborativos | Usuário marca no mapa "lotado", "fechado", "evento", "dica", "risco". Podem ser confirmados 👍 e expiram em 6 h, como no Waze |
| Buscar nesta área | Consulta o OpenStreetMap ao vivo (Overpass API) e acrescenta lugares que não estão na base |
| Roteiro | Escolha vários lugares; o app sugere a melhor ordem de visita (vizinho mais próximo + 2-opt) |
| Surpreenda-me | Sorteia um lugar aberto e próximo |
| Favoritos, tema escuro, link compartilhável | Salvos no navegador (localStorage) |
| PWA | Instalável e funciona offline para a base local (Service Worker) |
| Agora | Sugestão pela hora, pôr do sol calculado, chuva e temperatura (Open-Meteo) |
| Busca em toda Fortaleza | Se a base não tem (ex.: "churrascaria"), procura sozinho no OpenStreetMap |
| Guia narrado | Botão "Ouvir" em cada lugar e "Guia ao vivo" no roteiro (fala ao chegar perto de cada parada) |
| Busca por voz | Microfone na barra de busca (Chrome/Edge/Android, precisa de https) |
| Cartão pra Stories | O roteiro vira uma imagem 1080x1920 para compartilhar |
| Luz boa pra foto | Janelas de luz dourada de hoje nos lugares fotogênicos |
| Lista recolhível | Gaveta de 3 posições no celular e botão para esconder a lista no PC |
| Páginas para o Google | `npm run paginas` gera uma página por lugar + sitemap (feito sozinho no deploy) |

## Estrutura

```
index.html            página única
css/style.css         estilo responsivo (mobile first, tema claro/escuro)
js/search.js          motor de busca, Haversine, Levenshtein, roteiro (sem DOM, testado)
js/data.js            base curada de 34 lugares + categorias
js/app.js             interface, mapa, rotas, relatos
sw.js, manifest.*     PWA
tests/                testes automáticos (node:test)
docs/DOCUMENTACAO_TECNICA.md  documentação técnica para a apresentação
```

## Tecnologias e referências (open source)

- [Leaflet](https://github.com/Leaflet/Leaflet) — mapas · [OpenStreetMap](https://www.openstreetmap.org) — dados e tiles
- [OSRM](https://github.com/Project-OSRM/osrm-backend) (servidores FOSSGIS) — rotas · [Overpass API](https://github.com/drolbr/Overpass-API) — consulta ao OSM
- Ideias de produto: Waze (relatos com validade e confirmação), Google Maps (busca por intenção)

## Limitações conhecidas (honestidade acadêmica)

- Coordenadas e horários da base curada são **aproximados**; conferir antes de uso real.
- Relatos ficam só no navegador de quem os criou. Para serem de fato compartilhados é preciso um back-end (ver "Próximos passos" no relatório).
- Os servidores públicos de rotas e Overpass têm limite de uso; se caírem, o app mostra distância em linha reta.

## Licença

MIT. Dados do mapa © colaboradores do OpenStreetMap (ODbL).
