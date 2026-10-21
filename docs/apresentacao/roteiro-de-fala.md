# Roteiro de fala — Fortaleza Explora

Texto de apoio para a apresentação. Os slides 1 a 13 são a apresentação principal, cerca de 15 minutos (≈ 70 segundos cada), em linguagem simples e com a parte de programação só em visão geral. Os slides 14 a 19 são um apêndice técnico, para responder perguntas dos colegas depois.
**Antes de apresentar:** treine em voz alta e troque o que não soar como você. Se a sua disciplina tem regra sobre ferramentas de apoio, siga ela.

## 1. Fortaleza Explora

Boa tarde, eu sou o Pedro. Eu fiz o Fortaleza Explora, um aplicativo para responder uma pergunta simples: o que eu faço agora em Fortaleza? Ele junta duas matérias: Desenvolvimento Web, porque roda no navegador e dá para instalar no celular, e Busca e Recuperação de Informação, porque o centro dele é uma busca de lugares. Vou mostrar o problema, a ideia, o que o app faz, o que eu usei e o que ainda dá para melhorar.

## 2. O problema

Quando a gente vai a um lugar novo, as dúvidas são sempre as mesmas: está aberto? Vai chover? Vale a pena ir? Os mapas comuns dizem onde o lugar fica, mas não dizem o que fazer agora. Em Fortaleza isso pesa mais, porque o plano muda muito com o horário e com o clima. Foi essa a pergunta que guiou o projeto.

## 3. A ideia: um Waze de lugares

A proposta era fazer um aplicativo de busca, tipo um Waze de lugares interessantes de Fortaleza. Eu dividi em quatro partes: buscar, que é achar o lugar mesmo digitando errado; chegar, com mapa e rotas; decidir, com sugestões pela hora, sol e chuva; e a comunidade, com avisos que somem sozinhos, como no Waze. Eu olhei como outros apps resolvem problemas parecidos, como o Citymapper para rotas e o Swarm para o passaporte, e peguei as ideias.

## 4. O app

Este é o resultado. À esquerda, o mapa com um pin para cada lugar. À direita, a lista, que eu desenhei parecida com um guia de revista: foto, categoria, nome e informações principais. São 65 lugares de Fortaleza e arredores. No topo, em laranja, fica a sugestão do momento: na hora do almoço ele sugere lugares para comer, perto do pôr do sol sugere mirantes, e se estiver chovendo mostra só lugares cobertos.

## 5. Busca que entende o que você quer

Esta é a parte mais ligada à matéria de Busca. O app aceita erro de digitação: se a pessoa escreve “mercdo”, ele acha “mercado”. Ele também entende palavras parecidas: quem digita “comer” encontra restaurantes. E tem o caso que eu mais gosto: “churrascaria” não está na minha lista. Em vez de mostrar “nada encontrado”, o app procura em toda Fortaleza e achou 46 lugares. Os detalhes de como isso funciona por dentro estão no apêndice.

## 6. O app muda com a hora e o clima

Este é o diferencial. O app olha a hora e o clima. Se estiver chovendo, só aparecem lugares cobertos, como museus e cinemas. Nas praias o app mostra ondas, UV e vento, com um conselho simples, como “UV alto: passe protetor”. Tudo usa o horário de Fortaleza, então até um turista com o celular em outro fuso vê “aberto” ou “fechado” certo. Os dados do mar são uma estimativa, não vêm de um sensor na praia.

## 7. Como chegar e o que visitar

Aqui são duas funções. À esquerda, a rota: o app mostra carro, bike e a pé ao mesmo tempo, com o tempo de cada um, por exemplo 5, 13 e 30 minutos. Para o pôr do sol, ele diz a que horas você precisa sair. À direita, o roteiro: quando a pessoa escolhe vários lugares, o app organiza a ordem da visita para andar menos.

## 8. Passaporte e cartão para Stories

Um app precisa de um motivo para a pessoa voltar. Do Swarm eu peguei a ideia do passaporte: em cada lugar a pessoa toca em “Já fui aqui” e ganha um carimbo com a data, e há selos por categoria, como o “Praieiro” para quem visita três praias. Isso fica só no aparelho dela. Já o cartão para Stories é uma imagem que o app desenha com o roteiro montado, para a pessoa postar e divulgar o app.

## 9. Funciona no celular

Como a maioria vai usar no celular, eu pensei nele primeiro. Dá para instalar na tela inicial, como um app de verdade, e abrir mesmo sem internet. A lista é uma gaveta que acompanha o dedo: empurra para ver o mapa, puxa para ver a lista. Tem busca por voz e um guia que fala quando você chega perto de um lugar do roteiro. A localização e o microfone só são pedidos quando a pessoa toca nos botões.

## 10. O que eu usei e para quê

Aqui é uma visão geral do que eu usei, sem entrar em detalhe de código. Páginas web comuns, para o app abrir em qualquer navegador e celular. Mapas abertos, para ter mapa e rotas sem custo. Dados abertos de clima, para chuva, UV, vento e mar. Fotos de licença livre, com o crédito do autor. Testes automáticos, para não quebrar o que já funciona. E uma hospedagem gratuita, então o site fica no ar sem eu precisar de servidor. Nada disso pede cadastro ou chave, então qualquer pessoa consegue reproduzir.

## 11. Dados confiáveis

Num app de turismo, um pin no lugar errado é o erro mais visível. Por isso eu conferi cada posição no OpenStreetMap e, quando tinha, também na Wikipédia. Meus números iniciais erravam até 1,6 km, como no Farol do Mucuripe, e eu corrigi todos. As 47 fotos têm licença livre e mostram o autor. O que eu não consegui confirmar, tirei do app. Os horários de funcionamento ainda são estimados, e o app avisa isso.

## 12. Limites e possíveis atualizações

Quero ser sincero sobre os limites. Hoje os horários são estimados, os avisos da comunidade ficam só no aparelho de quem criou, e 18 lugares estão sem foto. O primeiro próximo passo é um servidor, para os avisos valerem entre pessoas. Depois, versões em inglês e espanhol, horários e preços reais e mais lugares. E também quero testar em mais celulares e medir a qualidade da busca.

## 13. Obrigado!

Obrigado por ouvirem. O endereço do app está na tela, e quem quiser pode abrir no celular e testar agora. Fico à disposição para perguntas.

## 14. Extra: detalhes técnicos

Este é o apêndice, para quem quiser ver por dentro. Os próximos slides explicam a parte técnica com mais detalhe.

## 15. Três camadas, sem framework

Eu escolhi não usar framework, só HTML, CSS e JavaScript. O app tem três camadas: a interface, que é o que se vê, com o Leaflet para o mapa; a lógica, que são arquivos separados que eu consigo testar sozinhos; e os dados, com 65 lugares e cinco serviços abertos. Como tudo roda no navegador, não precisei de servidor.

## 16. De onde vem cada informação

O mapa e as ruas vêm do OpenStreetMap. As rotas vêm do OSRM. Para achar lugares que não estão na minha base, uso o Overpass e o Nominatim, também do OpenStreetMap. Clima, UV, vento e mar vêm do Open-Meteo. As fotos vêm do Wikimedia Commons, só com licença livre. E tem a minha base com 65 lugares.

## 17. A busca por dentro

Quando alguém digita, o app faz quatro coisas. Primeiro, ignora acento e maiúscula. Segundo, dá mais pontos se a palavra está no nome do que se está só na descrição. Terceiro, entende sinônimos. Quarto, aceita erro de digitação usando a distância de Levenshtein, que conta quantas letras são diferentes: “mercdo” está a uma letra de “mercado”. Se não acha na base, procura em toda Fortaleza e guarda o resultado por 24 horas.

## 18. Ordem do roteiro: vizinho mais próximo

Escolher a melhor ordem de visita é o problema do caixeiro viajante, que é difícil de resolver de forma exata. Eu usei uma heurística: começo pelo lugar mais próximo e depois desfaço os cruzamentos do caminho, com uma técnica chamada 2-opt. Não garante o melhor caminho possível, mas para poucas paradas é rápido e bom.

## 19. Funciona offline: PWA

O app é um PWA, um aplicativo web progressivo. Um service worker guarda o app, a base e as fontes no aparelho, então ele abre sem internet. Eu simulei o comportamento do celular no computador, e ainda falta testar em aparelhos reais. Para publicar, uso o GitHub Pages: eu envio o código, o GitHub roda os 28 testes e, se passar, coloca o site no ar. Se um teste falhar, a versão antiga continua.
