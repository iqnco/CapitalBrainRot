export interface MissionMap {
  id: string;
  name: string;         // e.g. "Midterm"
  codename: string;     // e.g. "BREACH ALPHA"
  contentFolder: string; // subfolder under content/missions/
  available?: boolean;  // defaults to true if omitted
}

export interface Mission {
  id: string;
  name: string;
  codename: string;
  description: string;
  contentFile?: string;   // single-map missions (plain .md file)
  maps?: MissionMap[];    // multi-map missions (folder of PDFs/docs)
  difficulty: 'ROOKIE' | 'OPERATOR' | 'ELITE';
  available: boolean;
}

export const MISSIONS: Mission[] = [
  {
    id: 'operation-behave-organizationally',
    name: 'Organizational Behavior',
    codename: 'OB RECON',
    description: 'Organizational Behavior — IE University',
    difficulty: 'OPERATOR',
    available: true,
    maps: [
      {
        id: 'midterm',
        name: 'Midterm',
        codename: 'BREACH ALPHA',
        contentFolder: 'ob-midterm',
        available: false,
      },
      {
        id: 'final',
        name: 'Final',
        codename: 'BREACH OMEGA',
        contentFolder: 'ob-final',
      },
    ],
  },
  // Add more missions here by dropping files into /content/missions/
  // and adding an entry to this array
];
