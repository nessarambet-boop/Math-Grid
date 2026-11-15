import type {
  BuildingChallengeDef,
  BuildingLocationDef,
  PlacedShape,
  Shape2DDef,
  SolidShape3DDef,
  TreasureChestDef,
} from './types';

export const CANVAS_GRID_COLS = 12;
export const CANVAS_GRID_ROWS = 9;

export const SHAPE_COLORS = [
  '#0D9488', // Teal
  '#F59E0B', // Amber
  '#0284C7', // Sky Blue
  '#EA580C', // Orange
  '#E11D48', // Rose
  '#7C3AED', // Indigo/Violet
  '#10B981', // Emerald
  '#FBBF24', // Gold
  '#334155', // Slate
];

export const SHAPES_2D: Shape2DDef[] = [
  {
    id: 'persegi',
    name: 'Persegi',
    defaultColor: '#38BDF8',
    explanation: 'Bangun datar dengan 4 sisi yang sama panjang dan 4 sudut siku-siku (90°).',
    characteristics: [
      '4 sisi sama panjang',
      '4 sudut siku-siku 90°',
      'Sisi berhadapan sejajar',
    ],
    buildingExample: 'Jendela rumah, menara kecil, ubin kotak, dan batu benteng.',
    defaultWidth: 1.5,
    defaultHeight: 1.5,
    minSize: 0.5,
    maxSize: 5,
  },
  {
    id: 'persegi_panjang',
    name: 'Persegi Panjang',
    defaultColor: '#F59E0B',
    explanation: 'Bangun datar dengan 2 pasang sisi berhadapan sama panjang dan 4 sudut 90°.',
    characteristics: [
      'Sisi berhadapan sama panjang & sejajar',
      'Memiliki panjang dan lebar berbeda',
      '4 sudut siku-siku 90°',
    ],
    buildingExample: 'Dinding rumah, pintu, badan menara, tiang jembatan, dan tanda medis.',
    defaultWidth: 4,
    defaultHeight: 2.5,
    minSize: 0.5,
    maxSize: 9,
  },
  {
    id: 'segitiga',
    name: 'Segitiga',
    defaultColor: '#EA580C',
    explanation: 'Bangun datar yang dibatasi oleh 3 sisi lurus dan memiliki 3 titik sudut.',
    characteristics: [
      'Memiliki 3 sisi lurus',
      'Memiliki 3 titik sudut',
      'Jumlah sudut dalam 180°',
    ],
    buildingExample: 'Atap rumah, puncak menara kastil, dan rangka penyangga jembatan.',
    defaultWidth: 4,
    defaultHeight: 2,
    minSize: 1,
    maxSize: 8,
  },
  {
    id: 'trapesium',
    name: 'Trapesium',
    defaultColor: '#D97706',
    explanation: 'Segi empat yang memiliki tepat satu pasang sisi berhadapan yang sejajar.',
    characteristics: [
      'Memiliki 4 sisi dan 4 sudut',
      '1 pasang sisi sejajar (atas dan alas)',
      'Cocok untuk atap lebar atau struktur miring',
    ],
    buildingExample: 'Atap sekolah, badan jembatan, dan mahkota benteng kastil.',
    defaultWidth: 5,
    defaultHeight: 2,
    minSize: 1,
    maxSize: 9,
  },
  {
    id: 'jajar_genjang',
    name: 'Jajar Genjang',
    defaultColor: '#0D9488',
    explanation: 'Segi empat yang sisi-sisi berhadapannya sejajar dan sama panjang.',
    characteristics: [
      '2 pasang sisi sejajar & sama panjang',
      'Sudut berhadapan sama besar',
      'Tidak harus siku-siku 90°',
    ],
    buildingExample: 'Atap miring modern, kanopi bangunan, dan pola lantai kreatif.',
    defaultWidth: 3.5,
    defaultHeight: 2,
    minSize: 1,
    maxSize: 7,
  },
  {
    id: 'belah_ketupat',
    name: 'Belah Ketupat',
    defaultColor: '#7C3AED',
    explanation: 'Segi empat dengan keempat sisi sama panjang dan sudut berhadapan sama besar.',
    characteristics: [
      'Keempat sisi sama panjang',
      'Diagonal berpotongan tegak lurus',
      'Sisi berhadapan sejajar',
    ],
    buildingExample: 'Ornamen jendela hias, lambang kristal menara, dan layang-layang kota.',
    defaultWidth: 2,
    defaultHeight: 2,
    minSize: 1,
    maxSize: 5,
  },
  {
    id: 'lingkaran',
    name: 'Lingkaran',
    defaultColor: '#FBBF24',
    explanation:
      'Kurva tertutup sempurna di mana setiap titik berjarak sama (radius r) dari titik pusat.',
    characteristics: [
      'Ditentukan oleh titik pusat (x, y) dan jari-jari (r)',
      'Tidak memiliki titik sudut atau sisi lurus',
      'Diameter = 2 × jari-jari (r)',
    ],
    buildingExample: 'Jam menara, jendela bulat kapal/menara, roda kereta, dan matahari.',
    defaultWidth: 2,
    defaultHeight: 2,
    defaultRadius: 1,
    minSize: 0.5,
    maxSize: 3.5,
    isCircle: true,
  },
  {
    id: 'segi_lima',
    name: 'Segi Lima',
    defaultColor: '#10B981',
    explanation: 'Poligon datar dengan 5 sisi lurus dan 5 titik sudut.',
    characteristics: [
      'Memiliki 5 sisi sama panjang (beraturan)',
      'Memiliki 5 titik sudut',
      'Bentuk alami menyerupai rumah mini atau lencana',
    ],
    buildingExample: 'Papan nama sekolah, gerbang taman, dan lencana pahlawan kota.',
    defaultWidth: 2.5,
    defaultHeight: 2.5,
    minSize: 1,
    maxSize: 5,
  },
  {
    id: 'segi_enam',
    name: 'Segi Enam',
    defaultColor: '#E11D48',
    explanation: 'Poligon datar yang dibentuk oleh 6 sisi lurus dan 6 titik sudut.',
    characteristics: [
      'Memiliki 6 sisi sama panjang (beraturan)',
      'Memiliki 6 titik sudut',
      'Kuat untuk ubin sarang lebah & jendela kubah',
    ],
    buildingExample: 'Jendela menara observatorium, taman heksagonal, dan perisai kota.',
    defaultWidth: 2.5,
    defaultHeight: 2.5,
    minSize: 1,
    maxSize: 5,
  },
];

export const BUILDING_LOCATIONS: BuildingLocationDef[] = [
  {
    id: 'geometry-village',
    name: 'Geometry Village',
    subtitle: 'Desa Geometri · Rumah & Jembatan Awal',
    themeColor: 'emerald',
    unlockRequirementText: 'Terbuka sejak awal petualangan',
    unlockMinStars: 0,
    unlockMinChallenges: 0,
    decorSummary: 'Pohon rindang, sungai kecil, dan balon udara pagi hari.',
  },
  {
    id: 'shape-city',
    name: 'Shape City',
    subtitle: 'Kota Bentuk · Sekolah, Rumah Sakit & Jembatan',
    themeColor: 'sky',
    unlockRequirementText: 'Selesaikan 1 tantangan bangunan atau kumpulkan 4 bintang',
    unlockMinStars: 4,
    unlockMinChallenges: 1,
    decorSummary: 'Jalan kota modern, taman kota, dan lampu gedung berkelip.',
  },
  {
    id: 'castle-island',
    name: 'Castle Island',
    subtitle: 'Pulau Kastil · Menara & Kastil Kerajaan',
    themeColor: 'violet',
    unlockRequirementText: 'Selesaikan 2 tantangan bangunan atau kumpulkan 10 bintang',
    unlockMinStars: 10,
    unlockMinChallenges: 2,
    decorSummary: 'Langit senja berbintang, bendera berkibar, dan jembatan batu.',
  },
  {
    id: 'creative-zone',
    name: 'Creative Construction Zone',
    subtitle: 'Zona Bebas · Bangun Kota Impianmu Tanpa Batas',
    themeColor: 'amber',
    unlockRequirementText: 'Terbuka bebas untuk berkreasi kapan saja',
    unlockMinStars: 0,
    unlockMinChallenges: 0,
    decorSummary: 'Lahan terbuka luas dengan semua 9 bentuk 2D dan koleksi bangunanmu.',
  },
];

export const BUILDING_CHALLENGES: BuildingChallengeDef[] = [
  {
    id: 'bld-rumah',
    locationId: 'geometry-village',
    title: 'Tantangan 1 · Membangun Rumah',
    blueprintName: 'Rumah Hangat',
    instruction:
      'Buat sebuah rumah menggunakan satu persegi panjang (dinding), satu segitiga (atap di atas dinding), dua persegi (jendela), dan satu persegi panjang kecil sebagai pintu.',
    ruleType: 'challenge_rumah',
    requiredShapesSummary: [
      '1 Persegi Panjang besar (Dinding)',
      '1 Segitiga (Atap di atas dinding)',
      '2 Persegi (Jendela kiri & kanan)',
      '1 Persegi Panjang kecil (Pintu di dinding)',
    ],
    hints: [
      'Mulailah dengan 1 Persegi Panjang besar di tengah sebagai dinding utama.',
      'Letakkan 1 Segitiga tepat di atas dinding untuk menjadi atap rumah.',
      'Tambahkan 2 Persegi untuk jendela dan 1 Persegi Panjang kecil untuk pintu di dalam dinding!',
    ],
    starterBlueprint: [
      { type: 'persegi_panjang', cx: 6, cy: 6.2, width: 5, height: 3, rotation: 0, color: '#FDE68A', label: 'Dinding' },
      { type: 'segitiga', cx: 6, cy: 3.7, width: 5.5, height: 2, rotation: 0, color: '#EA580C', label: 'Atap' },
      { type: 'persegi', cx: 4.5, cy: 5.8, width: 1, height: 1, rotation: 0, color: '#38BDF8', label: 'Jendela' },
      { type: 'persegi', cx: 7.5, cy: 5.8, width: 1, height: 1, rotation: 0, color: '#38BDF8', label: 'Jendela' },
      { type: 'persegi_panjang', cx: 6, cy: 6.95, width: 1, height: 1.5, rotation: 0, color: '#92400E', label: 'Pintu' },
    ],
  },
  {
    id: 'bld-sekolah',
    locationId: 'shape-city',
    title: 'Tantangan 2 · Membangun Sekolah',
    blueprintName: 'Sekolah Ceria',
    instruction:
      'Buat sebuah sekolah menggunakan minimal empat bentuk geometri (gabungkan bangunan persegi panjang, atap trapesium di atasnya, jendela persegi, dan pintu).',
    ruleType: 'challenge_sekolah',
    requiredShapesSummary: [
      'Minimal 4 bentuk geometri',
      'Bangunan utama Persegi Panjang',
      'Atap Trapesium di atas bangunan',
      'Jendela Persegi & Pintu utama',
    ],
    hints: [
      'Letakkan Persegi Panjang lebar sebagai gedung utama sekolah.',
      'Pasang Trapesium di atas gedung sebagai atap sekolah!',
      'Tambahkan jendela Persegi dan pintu utama agar berjumlah minimal 4 bentuk.',
    ],
    starterBlueprint: [
      { type: 'persegi_panjang', cx: 6, cy: 6, width: 7, height: 3, rotation: 0, color: '#FDBA74', label: 'Gedung' },
      { type: 'trapesium', cx: 6, cy: 3.75, width: 7.5, height: 1.5, rotation: 0, color: '#0284C7', label: 'Atap Trapesium' },
      { type: 'persegi', cx: 3.8, cy: 5.7, width: 1, height: 1, rotation: 0, color: '#BAE6FD', label: 'Jendela' },
      { type: 'persegi', cx: 8.2, cy: 5.7, width: 1, height: 1, rotation: 0, color: '#BAE6FD', label: 'Jendela' },
      { type: 'persegi_panjang', cx: 6, cy: 6.75, width: 1.2, height: 1.5, rotation: 0, color: '#0D9488', label: 'Pintu' },
    ],
  },
  {
    id: 'bld-rumah-sakit',
    locationId: 'shape-city',
    title: 'Misi Kota · Rumah Sakit & Simbol Medis',
    blueprintName: 'Rumah Sakit Harapan',
    instruction:
      'Bangun Rumah Sakit dari bangunan utama persegi panjang, minimal 2 jendela persegi, dan simbol medis (+) dari dua persegi panjang kecil yang bersilangan.',
    ruleType: 'challenge_rumah_sakit',
    requiredShapesSummary: [
      '1 Persegi Panjang besar (Gedung utama)',
      'Minimal 2 Persegi (Jendela)',
      '2 Persegi Panjang kecil sebagai simbol medis (+)',
    ],
    hints: [
      'Gunakan 1 Persegi Panjang besar sebagai gedung Rumah Sakit.',
      'Tambahkan 2 Persegi untuk jendela dan buat tanda (+) dari 2 Persegi Panjang kecil (mendatar & tegak)!',
    ],
    starterBlueprint: [
      { type: 'persegi_panjang', cx: 6, cy: 5.5, width: 6, height: 4, rotation: 0, color: '#F8FAFC', label: 'Gedung RS' },
      { type: 'persegi', cx: 4, cy: 6.2, width: 1, height: 1, rotation: 0, color: '#38BDF8' },
      { type: 'persegi', cx: 8, cy: 6.2, width: 1, height: 1, rotation: 0, color: '#38BDF8' },
      { type: 'persegi_panjang', cx: 6, cy: 4.5, width: 1.5, height: 0.5, rotation: 0, color: '#E11D48', label: 'Palang' },
      { type: 'persegi_panjang', cx: 6, cy: 4.5, width: 0.5, height: 1.5, rotation: 0, color: '#E11D48', label: 'Palang' },
    ],
  },
  {
    id: 'bld-jembatan',
    locationId: 'shape-city',
    title: 'Misi Infrastruktur · Jembatan Sungai',
    blueprintName: 'Jembatan Geometris',
    instruction:
      'Bangun struktur jembatan menggunakan gabungan persegi panjang (jalan jembatan), segitiga (rangka penopang), dan trapesium (pondasi jembatan).',
    ruleType: 'challenge_jembatan',
    requiredShapesSummary: [
      'Minimal 1 Persegi Panjang (Jalan jembatan)',
      'Minimal 2 Segitiga (Rangka atas/penopang)',
      'Minimal 1 Trapesium (Pondasi penyangga)',
    ],
    hints: [
      'Pasang Persegi Panjang memanjang horizontal sebagai badan jembatan.',
      'Tambahkan Trapesium sebagai kaki penyangga di bawah dan minimal 2 Segitiga sebagai rangka jembatan!',
    ],
    starterBlueprint: [
      { type: 'persegi_panjang', cx: 6, cy: 5.5, width: 8, height: 1, rotation: 0, color: '#64748B', label: 'Jalan' },
      { type: 'segitiga', cx: 4, cy: 4, width: 3, height: 2, rotation: 0, color: '#EA580C' },
      { type: 'segitiga', cx: 8, cy: 4, width: 3, height: 2, rotation: 0, color: '#EA580C' },
      { type: 'trapesium', cx: 3, cy: 7, width: 2.5, height: 2, rotation: 0, color: '#D97706' },
      { type: 'trapesium', cx: 9, cy: 7, width: 2.5, height: 2, rotation: 0, color: '#D97706' },
    ],
  },
  {
    id: 'bld-menara',
    locationId: 'castle-island',
    title: 'Misi Pulau · Menara Jam Lingkaran',
    blueprintName: 'Menara Penjaga',
    instruction:
      'Bangun sebuah menara tinggi dengan badan persegi panjang, atap segitiga di atasnya, serta dekorasi lingkaran (jam) dan persegi.',
    ruleType: 'challenge_menara',
    requiredShapesSummary: [
      'Badan Menara Persegi Panjang tinggi',
      'Atap Segitiga di puncak',
      'Dekorasi Lingkaran (pusat & radius)',
      'Dekorasi Persegi (jendela)',
    ],
    hints: [
      'Buat badan menara dengan Persegi Panjang berdiri tegak (tinggi lebih besar dari lebar).',
      'Taruh Segitiga di puncak, lalu pasang Lingkaran sebagai jam menara dan Persegi sebagai jendela!',
    ],
    starterBlueprint: [
      { type: 'persegi_panjang', cx: 6, cy: 5.8, width: 2.5, height: 4.5, rotation: 0, color: '#94A3B8', label: 'Badan Menara' },
      { type: 'segitiga', cx: 6, cy: 2.55, width: 3, height: 2, rotation: 0, color: '#7C3AED', label: 'Atap' },
      { type: 'lingkaran', cx: 6, cy: 4.5, width: 1.4, height: 1.4, radius: 0.7, rotation: 0, color: '#FBBF24', label: 'Jam' },
      { type: 'persegi', cx: 6, cy: 6.5, width: 1, height: 1, rotation: 0, color: '#38BDF8', label: 'Jendela' },
    ],
  },
  {
    id: 'bld-kastil',
    locationId: 'castle-island',
    title: 'Tantangan 3 · Kastil Agung',
    blueprintName: 'Kastil 5 Bentuk',
    instruction:
      'Bangun sebuah kastil megah menggunakan minimal lima jenis bentuk geometri berbeda (misalnya persegi, persegi panjang, segitiga, trapesium, dan lingkaran/segi enam).',
    ruleType: 'challenge_kastil',
    requiredShapesSummary: [
      'Minimal 5 jenis bentuk geometri berbeda',
      'Gabungkan menara, tembok, atap, dan gerbang',
      'Minimal 6 bentuk terpasang pada grid',
    ],
    hints: [
      'Gunakan Persegi Panjang untuk dinding gerbang dan menara, Segitiga untuk atap menara, dan Trapesium untuk mahkota benteng.',
      'Tambahkan Persegi untuk menara kecil serta Lingkaran atau Segi Lima/Segi Enam sebagai lencana gerbang hingga terkumpul 5 jenis bentuk berbeda!',
    ],
    starterBlueprint: [
      { type: 'persegi_panjang', cx: 6, cy: 6, width: 4, height: 3, rotation: 0, color: '#CBD5E1' },
      { type: 'persegi', cx: 3.25, cy: 5.5, width: 1.5, height: 4, rotation: 0, color: '#94A3B8' },
      { type: 'persegi', cx: 8.75, cy: 5.5, width: 1.5, height: 4, rotation: 0, color: '#94A3B8' },
      { type: 'segitiga', cx: 3.25, cy: 2.75, width: 2, height: 1.5, rotation: 0, color: '#7C3AED' },
      { type: 'segitiga', cx: 8.75, cy: 2.75, width: 2, height: 1.5, rotation: 0, color: '#7C3AED' },
      { type: 'trapesium', cx: 6, cy: 4, width: 4.5, height: 1, rotation: 0, color: '#D97706' },
      { type: 'lingkaran', cx: 6, cy: 6.5, width: 1.2, height: 1.2, radius: 0.6, rotation: 0, color: '#F59E0B' },
    ],
  },
  {
    id: 'bld-creative',
    locationId: 'creative-zone',
    title: 'Creative Mode · Bangun Kota Impianmu',
    blueprintName: 'Kota Bebas Kreatif',
    instruction:
      'Bebas bereksperimen tanpa batas! Gabungkan 9 bentuk geometri untuk membuat stasiun roket, taman kota, atau kota impianmu lalu simpan ke koleksimu.',
    ruleType: 'creative',
    requiredShapesSummary: [
      'Bebas tanpa penilaian salah',
      'Semua 9 bentuk 2D tersedia',
      'Simpan desain ke Koleksi Bangunan',
    ],
    hints: [
      'Cobalah menggabungkan Segi Enam, Lingkaran, Trapesium, dan Segitiga untuk membuat roket luar angkasa atau taman bermain!',
    ],
    starterBlueprint: [
      { type: 'persegi_panjang', cx: 3.5, cy: 6.2, width: 2, height: 3, rotation: 0, color: '#0284C7' },
      { type: 'segitiga', cx: 3.5, cy: 3.8, width: 2.4, height: 1.8, rotation: 0, color: '#EA580C' },
      { type: 'lingkaran', cx: 3.5, cy: 5.8, width: 1, height: 1, radius: 0.5, rotation: 0, color: '#FBBF24' },
      { type: 'segi_enam', cx: 8, cy: 6, width: 2.2, height: 2.2, rotation: 0, color: '#10B981' },
      { type: 'trapesium', cx: 8, cy: 4.3, width: 2.6, height: 1.2, rotation: 0, color: '#D97706' },
    ],
  },
];

export const EXTRA_BUILDING_IDEAS: { name: string; shapes: Omit<PlacedShape, 'id'>[]; summary: string }[] = [
  {
    name: 'Stasiun Roket Matematika',
    summary: 'Badan persegi panjang, hidung segitiga, jendela lingkaran, dan sirip trapesium.',
    shapes: [
      { type: 'persegi_panjang', cx: 6, cy: 5.5, width: 2, height: 4, rotation: 0, color: '#0284C7' },
      { type: 'segitiga', cx: 6, cy: 2.5, width: 2.4, height: 2, rotation: 0, color: '#E11D48' },
      { type: 'lingkaran', cx: 6, cy: 4.8, width: 1.2, height: 1.2, radius: 0.6, rotation: 0, color: '#FBBF24' },
      { type: 'trapesium', cx: 6, cy: 7.9, width: 3.4, height: 1, rotation: 0, color: '#EA580C' },
    ],
  },
  {
    name: 'Paviliun Segi Enam',
    summary: 'Atap jajar genjang/trapesium dengan ruang segi enam & ornamen belah ketupat.',
    shapes: [
      { type: 'segi_enam', cx: 6, cy: 6, width: 3, height: 3, rotation: 0, color: '#10B981' },
      { type: 'trapesium', cx: 6, cy: 3.8, width: 4.2, height: 1.4, rotation: 0, color: '#F59E0B' },
      { type: 'belah_ketupat', cx: 6, cy: 6, width: 1.2, height: 1.2, rotation: 0, color: '#7C3AED' },
    ],
  },
];

/* ================= SEPARATED 3D SOLID SHAPES (BANGUN RUANG) ================= */

export const SOLID_SHAPES_3D: SolidShape3DDef[] = [
  {
    id: 'kubus',
    name: 'Kubus',
    base2DRelation: 'Disusun dari 6 sisi berbentuk Persegi sama besar',
    explanation: 'Bangun ruang tiga dimensi yang semua sisinya berbentuk persegi sama besar dan memiliki 12 rusuk sama panjang.',
    characteristics: ['6 sisi persegi kongruen', '12 rusuk sama panjang', '8 titik sudut'],
    buildingExample: 'Blok dadu bangunan, kotak pos taman, dan menara kubus.',
    color: '#0D9488',
  },
  {
    id: 'balok',
    name: 'Balok',
    base2DRelation: 'Sisi-sisinya berbentuk Persegi Panjang (dan/atau Persegi)',
    explanation: 'Bangun ruang tiga dimensi dengan 3 pasang sisi berhadapan yang sejajar dan sama besar.',
    characteristics: ['6 sisi berbentuk persegi panjang', '12 rusuk (panjang, lebar, tinggi)', '8 titik sudut'],
    buildingExample: 'Gedung sekolah, batu bata dinding, lemari, dan ruang kelas.',
    color: '#0284C7',
  },
  {
    id: 'tabung',
    name: 'Tabung',
    base2DRelation: 'Alas dan tutupnya berbentuk Lingkaran',
    explanation: 'Bangun ruang yang memiliki alas dan tutup lingkaran identik serta satu sisi lengkung selimut.',
    characteristics: ['2 sisi lingkaran (alas & tutup)', '1 selimut lengkung', 'Tidak memiliki titik sudut'],
    buildingExample: 'Pilar bundar bangunan, tangki air menara, dan tiang penyangga.',
    color: '#D97706',
  },
  {
    id: 'kerucut',
    name: 'Kerucut',
    base2DRelation: 'Alasnya berbentuk Lingkaran dengan 1 puncak lancip',
    explanation: 'Bangun ruang bersisi lengkung yang memiliki alas berbentuk lingkaran dan mengerucut ke satu titik puncak.',
    characteristics: ['1 alas lingkaran', '1 selimut lengkung', '1 titik puncak'],
    buildingExample: 'Atap menara kastil runcing, topi ulang tahun, dan pembatas jalan.',
    color: '#EA580C',
  },
  {
    id: 'prisma_segitiga',
    name: 'Prisma Segitiga',
    base2DRelation: 'Alas & tutup Segitiga, sisi tegak Persegi Panjang',
    explanation: 'Bangun ruang dengan alas dan atap berbentuk segitiga sejajar serta 3 sisi tegak berbentuk persegi panjang.',
    characteristics: ['2 sisi segitiga sejajar', '3 sisi tegak persegi panjang', '9 rusuk & 6 titik sudut'],
    buildingExample: 'Atap rumah miring, tenda perkemahan desa, dan atap gudang.',
    color: '#7C3AED',
  },
];

/* ================= TREASURE CHESTS ================= */

export const TREASURE_CHESTS: TreasureChestDef[] = [
  {
    id: 'chest-village-starter',
    title: 'Peti Arsitek Desa',
    description: 'Selesaikan Challenge 1 (Membangun Rumah) di Geometry Village.',
    rewardStars: 3,
    rewardXp: 150,
    unlockAccessory: 'topi_arsitek',
    accessoryLabel: 'Topi Arsitek HIGAYON',
  },
  {
    id: 'chest-shape-city',
    title: 'Peti Kota Bentuk',
    description: 'Selesaikan minimal 2 tantangan bangunan di Building World.',
    rewardStars: 4,
    rewardXp: 200,
    unlockAccessory: 'kacamata_bintang',
    accessoryLabel: 'Kacamata Bintang HIGAYON',
  },
  {
    id: 'chest-castle-royal',
    title: 'Peti Mahkota Kastil',
    description: 'Selesaikan Tantangan Kastil (5 jenis bentuk) atau kumpulkan 30 bintang.',
    rewardStars: 5,
    rewardXp: 300,
    unlockAccessory: 'mahkota_emas',
    accessoryLabel: 'Mahkota Emas HIGAYON',
  },
];
