# Como o Fortaleza Explora pode incentivar o turismo

Estudo de viabilidade feito em 29/10/2026. Cada ideia diz o que precisa, o esforço e o que já foi feito.

## Já feito
| Ideia | Situação |
|---|---|
| **Agenda de eventos** (grade com data, local, preço, adicionar ao calendário) | Pronta, com eventos conferidos e links para a agenda ao vivo. |
| **Aviso de evento próximo** na tela inicial | Pronto (janela de 21 dias). |
| **Passaporte** (carimbo por lugar, selos por conquista) | Pronto: dá motivo para visitar mais lugares. |
| **Acessibilidade** (dado do OpenStreetMap) | Pronto para 10 de 65 lugares; o resto aparece como "sem informação". |
| **Roteiros prontos** e roteiro por proximidade | Prontos. |

## Dá para fazer sem servidor (esforço baixo)
- **Roteiros por época:** "Carnaval", "Férias de julho", "Réveillon", escolhidos pela data. Só dados + um filtro.
- **Mais eventos**, a cada confirmação (Fortal, festas juninas, Festival de Jazz e Blues de Guaramiranga etc.). Precisa de fonte oficial para cada um.
- **Idiomas** (inglês e espanhol) para turistas. Esforço médio: textos dos 65 lugares precisam de tradução revisada por pessoa.
- **Modo offline completo** para quem chega sem chip: o app já abre sem internet; falta guardar mais mapa.
- **QR code em hotéis, pousadas e pontos turísticos** apontando para o app. Custo: impressão.

## Precisa de servidor (esforço alto, decidir com a equipe)
- **Comentários e fotos de acessibilidade** feitos por pessoas, com moderação. Precisa de banco de dados e contas.
- **Agenda atualizada por todos:** formulário "sugerir evento" + aprovação. Precisa de servidor ou de um formulário externo (por exemplo Google Forms) e alguém para revisar.
- **Avisos por notificação** ("hoje tem show perto de você"). Precisa de servidor de notificações.
- **Eventos puxados automaticamente** de Sympla ou de agendas oficiais. Hoje não existe API aberta e gratuita; exigiria acordo com a fonte ou coleta autorizada.

## Parcerias que fazem sentido para o pitch
Secretaria de Turismo (conteúdo oficial e eventos), hotéis e pousadas (QR), bares e restaurantes locais (destaque pago, já pensado na área de anúncios), produtores de eventos (divulgação).

## Riscos
- **Dado desatualizado é pior que dado ausente.** Por isso a agenda só tem eventos conferidos, com link da fonte.
- **Dependência de serviços gratuitos** (mapas, rotas, clima): há cache e aviso de falha, mas não há garantia de disponibilidade.
