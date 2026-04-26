export interface MissionMap {
  id: string;
  name: string;
  codename: string;
  contentFolder: string;
  available?: boolean;
}

export interface Mission {
  id: string;
  name: string;
  codename: string;
  description: string;
  contentFile?: string;
  maps?: MissionMap[];
  difficulty: 'ROOKIE' | 'OPERATOR' | 'ELITE';
  available: boolean;
}

export const MISSIONS: Mission[] = [
  {
    id: 'capital-markets',
    name: 'Capital Markets',
    codename: 'DELIRIO TOTALE',
    description: 'Capital Markets — IE University 🍕',
    difficulty: 'ELITE',
    available: true,
    maps: [
      {
        id: 'midterm',
        name: 'Midterm',
        codename: 'PRIMA TORTURA',
        contentFolder: 'ob-midterm',
        available: false,
      },
      {
        id: 'final',
        name: 'Final',
        codename: 'TORTURA FINALE',
        contentFolder: 'ob-final',
      },
    ],
  },
  // Add more subjects here — drop files into /content/missions/ and add an entry
];
