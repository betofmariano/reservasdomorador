const BUBBLE_CDN = 'https://24474ab5d210b2278be2e842e53ff440.cdn.bubble.io';

function bubbleImage(path: string): string {
  return `${BUBBLE_CDN}/${path}`;
}

export type PatrocinadorAppCard = {
  id: string;
  nome: string;
  headline: string;
  imageUrl: string;
};

export type PatrocinadorShowcaseItem = {
  id: string;
  imageUrl: string;
  caption: string;
};

export type PatrocinadorShowcaseSection = {
  id: string;
  title: string;
  items: PatrocinadorShowcaseItem[];
};

/** Conteúdo estático da página /patrocinador — substituir pela API depois. */
export const PATROCINADOR_APPS: PatrocinadorAppCard[] = [
  {
    id: 'reservasdomorador',
    nome: 'Reservas do Morador',
    headline: 'Reservas de espaços do condomínio com facilidade e justiça',
    imageUrl: '/icon-512.png',
  },
  {
    id: 'matchpoint',
    nome: 'MatchPoint',
    headline: 'Reservas de Quadras com Controle e Transparência',
    imageUrl: bubbleImage('f1773586861048x611569686196855800/matchpoint.png'),
  },
  {
    id: 'matchtraining',
    nome: 'MatchTraining',
    headline: 'A Revolução na Gestão de Treinos do seu Clube',
    imageUrl: bubbleImage('f1773586929459x951365670121542500/matchtraining.png'),
  },
  {
    id: 'matchgame',
    nome: 'MatchGame',
    headline: 'Gestão Completa de Competições Multiesportivas',
    imageUrl: bubbleImage('f1773586942677x992955692713953800/matchgame.png'),
  },
];

export const PATROCINADOR_SECTIONS: PatrocinadorShowcaseSection[] = [
  {
    id: 'banners',
    title: 'Nossos Banners de Tela',
    items: [
      {
        id: 'tela-inicial',
        imageUrl: bubbleImage(
          'f1773589892401x520781283986854850/tela%20inicial.jpg',
        ),
        caption:
          'Tela inicial do usuário, mostrando 4 ícones de patrocinadores. O clique no ícone abre o banner principal do patrocinador',
      },
      {
        id: 'banner-principal',
        imageUrl: bubbleImage('f1773587061236x601951397856997900/banner.png'),
        caption:
          'Banner principal apresentado a cada 15 minutos espontaneamente, com contagem regressiva de 5 segundos',
      },
      {
        id: 'banner-reserva',
        imageUrl: bubbleImage('f1773587078279x694528145680539300/popup.png'),
        caption:
          'Banner apresentado ao usuário após a realização de uma reserva, com links para Instagram, WhatsApp, Compra e Site.',
      },
      {
        id: 'banner-checkin',
        imageUrl: bubbleImage(
          'f1773587097790x554468185409195260/banner%20qrcode.png',
        ),
        caption:
          'Banner apresentado ao usuário para a realização de um check-in, com links para Instagram, WhatsApp, Compra e Site.',
      },
    ],
  },
  {
    id: 'whatsapp',
    title: 'Mensagens WhatsApp',
    items: [
      {
        id: 'wzap-quadra',
        imageUrl: bubbleImage(
          'f1773588811462x672438989411875800/wzap%20reserva%20matchpoint.jpeg',
        ),
        caption:
          'Mensagem WhatsApp com ilustração do patrocinador, enviada após a reserva de uma quadra.',
      },
      {
        id: 'wzap-cancelamento',
        imageUrl: bubbleImage(
          'f1773587757701x846975283812720300/wzap%20cancelamento%20reserva.jpg',
        ),
        caption:
          'Mensagem WhatsApp com ilustração do patrocinador, enviada após o cancelamento de uma reserva.',
      },
      {
        id: 'wzap-atividade',
        imageUrl: bubbleImage(
          'f1773588825197x708050801191301600/wzap%20reserva%20matchplace.jpeg',
        ),
        caption:
          'Mensagem WhatsApp com ilustração do patrocinador, enviada após a reserva de uma atividade.',
      },
      {
        id: 'wzap-aula',
        imageUrl: bubbleImage(
          'f1773588956965x995333543912458200/wzap%20aula%20agendada.jpg',
        ),
        caption:
          'Mensagem WhatsApp com ilustração do patrocinador, enviada como lembrete de uma aula.',
      },
    ],
  },
];

export const PATROCINADOR_FOOTER = {
  title: 'Plataforma Clube Conectado',
  credit: 'by LinkPower Technologia',
  logoUrl: bubbleImage(
    'f1773840164173x326096119080417000/logoRedondoLinkPower.gif',
  ),
} as const;
