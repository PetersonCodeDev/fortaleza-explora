// Agenda de eventos de Fortaleza. Só entra aqui o que foi conferido numa fonte oficial.
// `confirmado: true` quer dizer que a DATA é certa. A programação (shows, horários) muda a cada ano:
// por isso cada evento tem um link para a fonte, e a agenda ao vivo (Sympla, O Povo) fica logo abaixo na tela.
// Sem `inicio` = evento que acontece todo ano mas ainda não tem data fechada (aparece em "Em breve").
// Para atualizar: copie um bloco, troque as datas e o `id`, e rode `npm test`.

export const EVENTOS = [
  {
    id: "cine-ceara-2026", nome: "Cine Ceará", categoria: "cultura",
    inicio: "2026-11-07", fim: "2026-11-13", confirmado: true,
    local: "Cineteatro São Luiz e Cinema do Dragão, Fortaleza", lugarIds: ["cine-sao-luiz", "dragao-do-mar"],
    preco: "Sessões gratuitas e pagas",
    descricao: "Festival Íbero-americano de Cinema: filmes de vários países, debates com diretores e sessões no Centro e na Praia de Iracema.",
    link: "https://www.cineceara.com/", fonte: "Site do festival",
  },
  {
    id: "natal-de-luz", nome: "Ceará Natal de Luz", categoria: "lazer",
    quando: "Fim de novembro até dezembro (datas a confirmar)", confirmado: false,
    local: "Praça do Ferreira, Centro", lugarIds: ["praca-ferreira"],
    preco: "Gratuito",
    descricao: "Decoração e iluminação de Natal no Centro, com apresentações culturais. Acontece todos os anos; as datas de 2026 ainda não foram divulgadas.",
    link: "https://mais.opovo.com.br/", fonte: "Notícias locais (O Povo)",
  },
  {
    id: "reveillon-2026", nome: "Réveillon de Fortaleza", categoria: "noite",
    inicio: "2026-12-31", fim: "2026-12-31", confirmado: true,
    local: "Aterro da Praia de Iracema", lugarIds: ["estatua-iracema", "ponte-ingleses"],
    preco: "Gratuito",
    descricao: "Virada do ano à beira-mar, com shows e queima de fogos. A programação costuma ser divulgada em dezembro.",
    link: "https://mais.opovo.com.br/", fonte: "Notícias locais (O Povo)",
  },
  {
    id: "carnaval-2027", nome: "Carnaval de Fortaleza", categoria: "noite",
    inicio: "2027-02-06", fim: "2027-02-09", confirmado: true,
    local: "Vários pontos da cidade (Beira-Mar, Praia de Iracema, bairros)", lugarIds: ["praia-meireles"],
    preco: "Blocos gratuitos e festas pagas",
    descricao: "Do sábado à terça de Carnaval (a quarta-feira de cinzas é dia 10/02). Blocos de rua, Corso e festas. A programação completa sai mais perto da data.",
    link: "https://mais.opovo.com.br/", fonte: "Calendário oficial do Carnaval",
  },
];

// Onde ver a agenda completa e atualizada (shows, teatro, festas). Todos os links foram abertos e respondem.
export const AGENDAS_AO_VIVO = [
  { nome: "Sympla: eventos em Fortaleza", desc: "Shows, teatro, cursos e festas com ingresso", url: "https://www.sympla.com.br/eventos/fortaleza-ce" },
  { nome: "O Povo: Vida & Arte", desc: "Cultura e programação da cidade", url: "https://mais.opovo.com.br/" },
  { nome: "Diário do Nordeste", desc: "Notícias e agenda de eventos", url: "https://diariodonordeste.verdesmares.com.br/" },
];
