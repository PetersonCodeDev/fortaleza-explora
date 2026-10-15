# Roteiro de fala — Fortaleza Explora

Texto de apoio para a apresentação (18 slides, cerca de 15 a 18 minutos). Está em primeira pessoa e em linguagem simples.
**Antes de apresentar:** treine em voz alta, troque o que não soar como você e leia o slide 17 ("Como eu trabalhei") com cuidado: ele precisa refletir a regra da sua disciplina e o que você realmente fez. Esteja pronto para explicar qualquer trecho do código.

A apresentação em slides está no claude.ai (menu para baixar em PowerPoint ou PDF).

## 1. Fortaleza Explora

Boa tarde. Eu sou o Pedro. Vou mostrar o Fortaleza Explora, um aplicativo que eu fiz para responder uma pergunta simples: o que eu faço agora em Fortaleza? Ele junta duas disciplinas: Desenvolvimento Web, porque é um aplicativo que roda no navegador e instala no celular, e Busca e Recuperação de Informação, porque o coração dele é um sistema de busca. Vou contar o problema, como eu pensei, o que eu usei e como eu garanti que os dados são confiáveis. No final tem os limites e o que ainda falta.

## 2. Quem está em Fortaleza não sabe o que fazer agora

Quando eu penso em visitar uma cidade, as dúvidas são sempre as mesmas: está aberto? Vai chover? Vale a pena ir até lá? Os mapas comuns respondem “onde fica”, mas não respondem “o que eu faço agora”. Em Fortaleza isso pesa ainda mais, porque o plano muda muito com o horário e com o clima. Essa foi a pergunta que guiou o projeto.

## 3. Um Waze, mas de lugares

A proposta que recebi foi montar um aplicativo de busca, tipo um Waze sobre o que há de interessante em Fortaleza. Eu transformei isso em quatro peças: uma busca que entende erro de digitação; mapa e rotas; contexto, ou seja, hora, sol, chuva e mar; e comunidade, com avisos que somem sozinhos, que é a ideia do Waze. Cada uma dessas peças aparece nos próximos slides.

## 4. Aprendi com apps do mundo todo

Eu não inventei tudo do zero. Estudei como apps do mundo resolvem problemas parecidos e peguei a ideia, não o código. Do Waze veio a informação da comunidade que vence sozinha, com validade. Do Citymapper, comparar os modos de ir lado a lado. Do Swarm, o passaporte com selos. De apps de surfe e vento, mostrar o mar em linguagem simples. De apps de fotografia, a hora da luz boa. E dos guias de turismo, a curadoria: poucos lugares, bem escolhidos. Cada ideia virou uma função do meu app.

## 5. O Fortaleza Explora

Este é o resultado. À esquerda o mapa de Fortaleza, com um pin para cada lugar, na cor da categoria. À direita a lista, que eu desenhei como um guia de revista: foto real, categoria, título e as informações principais. E no topo, em laranja, a sugestão do momento. Na hora do almoço ele sugere lugares para comer; perto do pôr do sol, sugere mirantes; se estiver chovendo, só lugares cobertos. Nos próximos slides eu explico como cada parte funciona por dentro.

## 6. Três camadas, sem framework

Em tecnologia eu fiz uma escolha de propósito: não usei framework. É HTML, CSS e JavaScript puros. Isso deixa o aplicativo leve, com 112 KB de código meu, e fácil de explicar. Eu separei em três camadas. A interface, que é o que se vê na tela, com o Leaflet para o mapa. A lógica, que são módulos que não mexem na tela, por isso eu consigo testar cada um sozinho com testes automáticos. E os dados: uma base de 32 lugares conferidos e cinco serviços abertos. Como tudo roda no navegador, eu não precisei de servidor próprio, e isso deixa a hospedagem gratuita.

## 7. De onde vem cada informação

Aqui estão as fontes de dados. O mapa e as ruas vêm do OpenStreetMap, que é como a Wikipédia dos mapas. As rotas vêm do OSRM. Para achar lugares que não estão na minha base eu consulto o Overpass e o Nominatim, que são buscas do próprio OpenStreetMap. O clima, o UV, o vento e o mar vêm do Open-Meteo. As fotos vêm do Wikimedia Commons, e eu só uso as que têm licença livre, mostrando autor e licença em cada uma. E tem a minha base curada, com 32 lugares. O ponto importante: nenhum desses serviços pede chave nem cadastro, então qualquer pessoa consegue reproduzir o projeto.

## 8. Busca que tolera erros e vai além da base

Esta é a parte que mais tem a ver com a disciplina de Busca. Quando alguém digita, o app faz quatro coisas. Primeiro, tira acentos e maiúsculas, para praça e Praça serem a mesma coisa. Segundo, dá pontos por campo: se a palavra está no nome vale mais do que se está só na descrição. Terceiro, entende sinônimos: quem digita “comer” encontra restaurantes e peixe. Quarto, tolera erro de digitação, usando a distância de Levenshtein, que conta quantas letras mudaram: “mercdo” está a uma letra de “mercado”. À direita, o caso que eu mais gosto: “churrascaria” não está na minha base de 32 lugares. Em vez de dizer “nada encontrado”, o app procura em toda Fortaleza, em duas fontes ao mesmo tempo, e mostra os resultados à medida que chegam. Nesta busca vieram 46 lugares. O resultado também fica guardado por 24 horas, então repetir a busca é instantâneo e funciona até sem internet.

## 9. O app muda com a hora, o sol e a chuva

Este é o diferencial. O app olha o contexto. A hora e o pôr do sol eu calculo dentro do próprio aparelho, com um algoritmo público da NOAA, então funciona até sem internet. Se estiver chovendo, o app só sugere lugares cobertos. Nas praias, ele mostra as ondas, a temperatura da água, o UV e o vento, e dá um conselho em palavras simples, como “UV alto: passe protetor”. E um detalhe que parece pequeno mas importa: tudo usa o horário de Fortaleza. Um turista com o celular em outro fuso horário ainda vê “aberto” ou “fechado” corretamente. Os dados do mar vêm de um modelo meteorológico, não de um sensor na praia, então são uma estimativa.

## 10. Como chegar e em que ordem visitar

Aqui tem duas funções. À esquerda, a rota. Em vez de escolher um modo e esperar, o app pede as três rotas ao mesmo tempo, carro, bike e a pé, e mostra o tempo de cada uma lado a lado: 5 minutos de carro, 13 de bike, 30 a pé. E quando o lugar é de pôr do sol, ele calcula a que horas você precisa sair para chegar com folga. À direita, o roteiro. Se a pessoa escolhe vários lugares, a ordem em que ela visita faz diferença na distância. É o problema do caixeiro viajante, que é difícil de resolver de forma exata. Eu usei uma heurística: começo pelo vizinho mais próximo e depois melhoro o caminho com a técnica 2-opt, que desfaz cruzamentos. Não garante o melhor possível, mas para poucas paradas é rápido e bom, e nos testes ele nunca ficou pior que a ordem original.

## 11. Passaporte e cartão para Stories

Um app útil precisa de um motivo para a pessoa voltar e para contar aos amigos. Do Swarm eu peguei a ideia do passaporte: em cada lugar a pessoa toca em “Já fui aqui” e ganha um carimbo, com a data. O app mostra o progresso por categoria e dez selos, como “Praieiro” para quem visita três praias. Isso fica só no aparelho dela. Já o cartão para Stories é uma imagem que o próprio app desenha quando a pessoa monta um roteiro: título, mapa estilizado do caminho e a lista de paradas, com o nome do app embaixo. É divulgação gratuita, feita pelos próprios usuários.

## 12. Como tirei a “cara de IA” do app

Eu me preocupei que o app não parecesse genérico, desses feitos por inteligência artificial. Pesquisei o que costuma denunciar esse visual: gradiente roxo, uma fonte só para tudo, cantos arredondados iguais em tudo, emojis no lugar de ícones, cartões iguais em fila. E tomei decisões contrárias. Escolhi uma paleta própria, tirada da cidade: papel quente, verde do mar e laranja do sol. Usei três fontes com função: Young Serif nos títulos, Atkinson Hyperlegible no texto, que foi desenhada para ser muito legível, e Caveat para as dicas, como se fossem escritas à caneta. Coloquei fotos reais com crédito. Desenhei uma jangada em estilo de xilogravura, que lembra a arte de cordel do Ceará. E a lista é um índice de guia, com linhas finas e cantos quase retos, em vez de cartões iguais.

## 13. Instala como aplicativo e funciona sem internet

A maior parte das pessoas vai usar no celular, então eu pensei nele primeiro. O aplicativo é uma PWA, um aplicativo web progressivo: dá para instalar na tela inicial e abrir sem a barra do navegador. Um service worker guarda o aplicativo, a base e as fontes, então ele abre mesmo sem internet. A lista virou uma gaveta que acompanha o dedo: dá para empurrar para baixo e ver o mapa inteiro, e puxar para cima para ver a lista. Tem busca por voz, um guia que fala quando você chega perto de um lugar do roteiro, e o botão “perto de mim”. A localização e o microfone só são pedidos quando a pessoa toca nos botões, nunca ao abrir. Atenção: eu simulei o comportamento do celular no computador. O teste em aparelhos reais ainda precisa ser feito.

## 14. Como garanti que os dados são confiáveis

Em um aplicativo de turismo, um pin no lugar errado é o erro mais visível. Por isso eu conferi os dados. Cada posição foi comparada com duas fontes independentes, o OpenStreetMap e a Wikipédia. Minhas estimativas iniciais erravam em até 1,6 km, o Farol do Mucuripe por exemplo, e eu corrigi todas. As descrições seguem os artigos da Wikipédia. As 27 fotos têm licença livre, e o app mostra o autor e a licença em cada uma. Um caso que mostra o valor da conferência: a Wikipédia apontava um forte em Portugal no lugar da Fortaleza de Nossa Senhora da Assunção, e eu só percebi porque comparei as coordenadas. E o que eu não consegui confirmar, eu tirei do app. Por fim, são 27 testes automáticos que rodam a cada publicação; se algum falhar, a versão antiga continua no ar. Um detalhe: os horários de funcionamento continuam estimados, e o app avisa isso.

## 15. No ar, de graça e de forma automática

Para colocar no ar eu usei uma hospedagem gratuita, o GitHub Pages. O processo é automático. Eu envio o código para o GitHub. Um robô do próprio GitHub, o Actions, roda os 27 testes. Se passar, ele gera uma página para cada lugar, com título e descrição, o que ajuda o Google a encontrar o app, e publica com https, que é necessário para o GPS e para instalar o aplicativo. Se um teste falhar, a versão antiga continua no ar. O endereço está na tela e o código é aberto, com licença MIT. Se alguém da turma quiser abrir no celular agora, é só digitar o endereço.

## 16. O que ainda falta, e eu sei disso

Vou ser franco sobre os limites. Os horários de funcionamento são estimados, e o app avisa para confirmar no local. Os avisos da comunidade ficam só no aparelho de quem os criou, porque eu não tenho servidor; para valer entre pessoas, é preciso um servidor, e esse é o primeiro próximo passo. Os serviços gratuitos que eu uso às vezes demoram, por isso o app guarda o resultado da busca por 24 horas. Cinco lugares ficaram sem foto, porque não achei imagem livre adequada. E eu ainda preciso testar em mais celulares. Nos próximos passos: o servidor, preço real e acessibilidade com dados conferidos, inglês e espanhol, medir a qualidade da busca com métricas como precisão, e parcerias com o comércio local quando houver público.

## 17. Como eu trabalhei

Quero deixar claro como eu trabalhei. Eu propus o problema e as ideias e decidi o que entra e o que fica de fora. O código foi escrito com ajuda de um assistente de inteligência artificial, o Claude Code. E o que torna isso confiável é a conferência: cada posição, foto e texto foi comparado com fontes abertas antes de entrar no aplicativo, e há testes automáticos. Tudo é código aberto e os créditos estão dentro do app. [PEDRO: ajuste este slide e a fala à regra da sua disciplina sobre o uso de ferramentas de apoio, e diga com suas palavras o que você decidiu, o que testou e o que aprendeu. Esteja pronto para explicar qualquer trecho do código se pedirem.]

## 18. Obrigado!

Obrigado por ouvirem. O endereço do aplicativo está na tela, quem quiser pode abrir no celular e testar agora. Estou à disposição para perguntas, sobre a busca, sobre os dados, sobre o visual ou sobre qualquer parte do código.
