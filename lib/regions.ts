import { getLevel } from './progression';

export interface Region {
  id:          string;
  name:        string;
  city:        string;
  levelRequired: number;
  characterId: string;
  characterName: string;
  accentColor: string;
  bgImage:     string;
}

export const REGIONS: Region[] = [
  {
    id:            'lazio',
    name:          'Lazio',
    city:          'Roma',
    levelRequired: 1,
    characterId:   'tralalero',
    characterName: 'Tralalero Tralala',
    accentColor:   '#c2652a',
    bgImage:       '/regions/lazio.png',
  },
  {
    id:            'campania',
    name:          'Campania',
    city:          'Napoli',
    levelRequired: 2,
    characterId:   'bombardilocrocodilo',
    characterName: 'Bombardilo Crocodilo',
    accentColor:   '#CE2B37',
    bgImage:       '/regions/campania.png',
  },
  {
    id:            'sicily',
    name:          'Sicilia',
    city:          'Palermo',
    levelRequired: 3,
    characterId:   'tungtungsahur',
    characterName: 'Tung Tung Sahur',
    accentColor:   '#0096c7',
    bgImage:       '/regions/sicily.png',
  },
  {
    id:            'tuscany',
    name:          'Toscana',
    city:          'Firenze',
    levelRequired: 4,
    characterId:   'capuccinoasesino',
    characterName: 'Cappuccino Assassino',
    accentColor:   '#8b7cf7',
    bgImage:       '/regions/tuscany.png',
  },
  {
    id:            'lombardy',
    name:          'Lombardia',
    city:          'Milano',
    levelRequired: 5,
    characterId:   'brrprrpatapim',
    characterName: 'Brr Brr Patapim',
    accentColor:   '#4a90d9',
    bgImage:       '/regions/lombardy.png',
  },
  {
    id:            'veneto',
    name:          'Veneto',
    city:          'Venezia',
    levelRequired: 6,
    characterId:   'lirililarila',
    characterName: 'Lirili Larila',
    accentColor:   '#00b4cc',
    bgImage:       '/regions/veneto.png',
  },
  {
    id:            'piedmont',
    name:          'Piemonte',
    city:          'Torino',
    levelRequired: 7,
    characterId:   'chimpanzinibananini',
    characterName: 'Chimpanzini Bananini',
    accentColor:   '#4a3f8c',
    bgImage:       '/regions/piedmont.png',
  },
  {
    id:            'sardinia',
    name:          'Sardegna',
    city:          'Cagliari',
    levelRequired: 8,
    characterId:   'lavacasaturnosaturnita',
    characterName: 'La Vaca Saturna Saturnita',
    accentColor:   '#e07b8a',
    bgImage:       '/regions/sardinia.png',
  },
];

export function getUnlockedRegions(xp: number): Region[] {
  const { level } = getLevel(xp);
  return REGIONS.filter(r => r.levelRequired <= level);
}

export function getCurrentRegion(xp: number): Region {
  const unlocked = getUnlockedRegions(xp);
  return unlocked[unlocked.length - 1] ?? REGIONS[0];
}

export function getRegionById(id: string): Region | undefined {
  return REGIONS.find(r => r.id === id);
}
