function formatPrivateKey(pk?: string, fallback: `0x${string}` = '0x0000000000000000000000000000000000000000000000000000000000000001'): `0x${string}` {
  if (!pk) return fallback;
  const trimmed = pk.trim();
  return (trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`) as `0x${string}`;
}

export const ZERO_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000';

export interface ActorProfile {
  name: string;
  role: 'funder' | 'booster' | 'cleaner';
  privateKey: `0x${string}`;
  address?: `0x${string}`;
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
    privateKey: formatPrivateKey(
      process.env.FUNDER_1_PK || process.env.NEXT_PUBLIC_FUNDER_1_PK
    ),
    address: (process.env.NEXT_PUBLIC_FUNDER_1_ADDRESS as `0x${string}`) || ZERO_ADDRESS,
    defaultAmount: '5.0',
    locationLabel: 'Jl. Malioboro No. 42',
    image: '/images/banner-before.jpg',
    coords: { lat: -7.7956, lng: 110.3695 },
  },
  '2': {
    name: 'Bu Sri (Warga)',
    role: 'funder',
    privateKey: formatPrivateKey(
      process.env.FUNDER_2_PK || process.env.NEXT_PUBLIC_FUNDER_2_PK
    ),
    address: (process.env.NEXT_PUBLIC_FUNDER_2_ADDRESS as `0x${string}`) || ZERO_ADDRESS,
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
    privateKey: formatPrivateKey(
      process.env.BOOSTER_1_PK || process.env.NEXT_PUBLIC_BOOSTER_1_PK
    ),
    address: (process.env.NEXT_PUBLIC_BOOSTER_1_ADDRESS as `0x${string}`) || ZERO_ADDRESS,
    defaultAmount: '2.0',
  },
};

export const CLEANERS: Record<string, ActorProfile> = {
  '1': {
    name: 'Agus (Petugas Kebersihan)',
    role: 'cleaner',
    privateKey: formatPrivateKey(
      process.env.CLEANER_1_PK || process.env.NEXT_PUBLIC_CLEANER_1_PK
    ),
    address: (process.env.NEXT_PUBLIC_CLEANER_1_ADDRESS as `0x${string}`) || ZERO_ADDRESS,
  },
};

export const DEMO_COORDS = { lat: -7.7956, lng: 110.3695 };
export const DEMO_REPORT_ID = '0x000000000000000000000000007469636b65742d6d616c696f626f726f2d3031' as `0x${string}`;
