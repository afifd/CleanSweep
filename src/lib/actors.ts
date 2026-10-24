export interface ActorProfile {
  name: string;
  role: 'funder' | 'booster' | 'cleaner';
  privateKey: `0x${string}`;
  defaultAmount?: string;
  locationLabel?: string;
  image?: string;
  reportId?: `0x${string}`;
  coords?: { lat: number; lng: number };
}

export const FUNDERS: Record<string, ActorProfile> = {
  '1': {
    name: 'Pak Budi (Pemilik Ruko)',
    role: 'funder',
    privateKey: (process.env.NEXT_PUBLIC_FUNDER_1_PK || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as `0x${string}`,
    defaultAmount: '5.0',
    locationLabel: 'Jl. Malioboro No. 42',
    image: '/images/banner-before.jpg',
    coords: { lat: -7.7956, lng: 110.3695 },
  },
  '2': {
    name: 'Bu Sri (Warga)',
    role: 'funder',
    privateKey: (process.env.NEXT_PUBLIC_FUNDER_2_PK || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d') as `0x${string}`,
    defaultAmount: '3.0',
    locationLabel: 'Simpang Tugu Yogyakarta',
    image: '/images/trash1.webp',
    coords: { lat: -7.7829, lng: 110.3671 },
  },
};

export const BOOSTERS: Record<string, ActorProfile> = {
  '1': {
    name: 'Komunitas Warga Peduli',
    role: 'booster',
    privateKey: (process.env.NEXT_PUBLIC_BOOSTER_1_PK || '0x5de4111afa1a4b94908f83103eb294b140c2e3639e53ce4bde8c5a891f61f0a4') as `0x${string}`,
    defaultAmount: '2.0',
  },
};

export const CLEANERS: Record<string, ActorProfile> = {
  '1': {
    name: 'Agus (Petugas Kebersihan)',
    role: 'cleaner',
    privateKey: (process.env.NEXT_PUBLIC_CLEANER_1_PK || '0x47e179ec340f64e0302586469c16da4e0a4f35ff0073575643cf4a60086beadc') as `0x${string}`,
  },
};

export const DEMO_COORDS = { lat: -7.7956, lng: 110.3695 };
export const DEMO_REPORT_ID = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;
