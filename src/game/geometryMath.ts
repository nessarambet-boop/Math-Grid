import type { ValidationResult } from './types';

export interface VertexCoord {
  x: number;
  y: number;
}

export interface GridSegment {
  id: string;
  a: VertexCoord;
  b: VertexCoord;
}

export type GeometryShapeKind =
  | 'kosong'
  | 'terbuka'
  | 'persegi'
  | 'persegi_panjang'
  | 'segi_empat_lain';

export interface PolygonAnalysis {
  isClosed: boolean;
  hasSelfIntersection: boolean;
  vertexCount: number;
  edgeCount: number;
  orderedVertices: VertexCoord[];
  sideLengths: number[];
  rightAngleCorners: boolean[];
  oppositeSidesParallel: [boolean, boolean];
  oppositeSidesEqual: [boolean, boolean];
  allSidesEqual: boolean;
  allAnglesRight: boolean;
  shapeKind: GeometryShapeKind;
  shapeLabel: string;
}

export function vertexKey(v: VertexCoord): string {
  return `${v.x},${v.y}`;
}

export function sameVertex(a: VertexCoord, b: VertexCoord): boolean {
  return a.x === b.x && a.y === b.y;
}

export function segmentKey(a: VertexCoord, b: VertexCoord): string {
  const ka = vertexKey(a);
  const kb = vertexKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

export function vecSub(to: VertexCoord, from: VertexCoord): VertexCoord {
  return { x: to.x - from.x, y: to.y - from.y };
}

export function vecAdd(a: VertexCoord, b: VertexCoord): VertexCoord {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function dotProduct(u: VertexCoord, v: VertexCoord): number {
  return u.x * v.x + u.y * v.y;
}

export function crossProduct(u: VertexCoord, v: VertexCoord): number {
  return u.x * v.y - u.y * v.x;
}

export function distSquared(a: VertexCoord, b: VertexCoord): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

export function segmentLength(a: VertexCoord, b: VertexCoord): number {
  return Math.sqrt(distSquared(a, b));
}

export function formatLengthCm(len: number): string {
  if (Math.abs(len - Math.round(len)) < 1e-6) {
    return `${Math.round(len)} cm`;
  }
  return `${len.toFixed(1)} cm`;
}

export function areVectorsParallel(u: VertexCoord, v: VertexCoord): boolean {
  if ((u.x === 0 && u.y === 0) || (v.x === 0 && v.y === 0)) return false;
  return crossProduct(u, v) === 0;
}

export function areVectorsPerpendicular(u: VertexCoord, v: VertexCoord): boolean {
  if ((u.x === 0 && u.y === 0) || (v.x === 0 && v.y === 0)) return false;
  return dotProduct(u, v) === 0;
}

export function deduplicateSegments(segments: GridSegment[]): GridSegment[] {
  const seen = new Set<string>();
  const out: GridSegment[] = [];
  for (const seg of segments) {
    if (sameVertex(seg.a, seg.b)) continue;
    const k = segmentKey(seg.a, seg.b);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(seg);
    }
  }
  return out;
}

function orient(a: VertexCoord, b: VertexCoord, c: VertexCoord): number {
  return crossProduct(vecSub(b, a), vecSub(c, a));
}

function onSegment(a: VertexCoord, b: VertexCoord, p: VertexCoord): boolean {
  return (
    Math.min(a.x, b.x) <= p.x &&
    p.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= p.y &&
    p.y <= Math.max(a.y, b.y)
  );
}

/**
 * Checks if two segments properly cross or collinearly overlap (ignoring shared endpoints).
 */
export function segmentsIntersectNonEndpoint(
  a1: VertexCoord,
  a2: VertexCoord,
  b1: VertexCoord,
  b2: VertexCoord
): boolean {
  const sharesEndpoint =
    sameVertex(a1, b1) || sameVertex(a1, b2) || sameVertex(a2, b1) || sameVertex(a2, b2);
  if (sharesEndpoint) {
    // Check collinear overlap if they share an endpoint
    const o1 = orient(a1, a2, b1);
    const o2 = orient(a1, a2, b2);
    if (o1 === 0 && o2 === 0) {
      const otherB = sameVertex(a1, b1) || sameVertex(a2, b1) ? b2 : b1;
      const shared = sameVertex(a1, b1) || sameVertex(a1, b2) ? a1 : a2;
      const otherA = sameVertex(shared, a1) ? a2 : a1;
      return dotProduct(vecSub(otherA, shared), vecSub(otherB, shared)) > 0;
    }
    return false;
  }

  const d1 = orient(a1, a2, b1);
  const d2 = orient(a1, a2, b2);
  const d3 = orient(b1, b2, a1);
  const d4 = orient(b1, b2, a2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  if (d1 === 0 && onSegment(a1, a2, b1)) return true;
  if (d2 === 0 && onSegment(a1, a2, b2)) return true;
  if (d3 === 0 && onSegment(b1, b2, a1)) return true;
  if (d4 === 0 && onSegment(b1, b2, a2)) return true;
  return false;
}

/**
 * Extracts a simple closed polygon cycle from an array of segments.
 */
export function extractClosedLoop(rawSegments: GridSegment[]): {
  isClosed: boolean;
  orderedVertices: VertexCoord[];
  hasSelfIntersection: boolean;
} {
  const segments = deduplicateSegments(rawSegments);
  if (segments.length < 3) {
    return { isClosed: false, orderedVertices: [], hasSelfIntersection: false };
  }

  const adj = new Map<string, VertexCoord[]>();
  const coordMap = new Map<string, VertexCoord>();

  for (const s of segments) {
    const ka = vertexKey(s.a);
    const kb = vertexKey(s.b);
    coordMap.set(ka, s.a);
    coordMap.set(kb, s.b);
    adj.set(ka, [...(adj.get(ka) ?? []), s.b]);
    adj.set(kb, [...(adj.get(kb) ?? []), s.a]);
  }

  // Every vertex must have degree exactly 2 for a single simple closed loop
  for (const neighbors of adj.values()) {
    if (neighbors.length !== 2) {
      return { isClosed: false, orderedVertices: [], hasSelfIntersection: false };
    }
  }

  const startKey = Array.from(coordMap.keys())[0];
  const orderedVertices: VertexCoord[] = [];
  const visited = new Set<string>();
  let currKey = startKey;
  let prevKey: string | null = null;

  while (true) {
    if (visited.has(currKey)) break;
    visited.add(currKey);
    orderedVertices.push(coordMap.get(currKey)!);
    const neighbors = adj.get(currKey) ?? [];
    const next = neighbors.find((n) => vertexKey(n) !== prevKey);
    if (!next) break;
    prevKey = currKey;
    currKey = vertexKey(next);
  }

  const isClosed =
    orderedVertices.length === coordMap.size &&
    orderedVertices.length === segments.length &&
    currKey === startKey;

  if (!isClosed) {
    return { isClosed: false, orderedVertices: [], hasSelfIntersection: false };
  }

  // Check self-intersection among loop edges
  let hasSelfIntersection = false;
  const n = orderedVertices.length;
  for (let i = 0; i < n; i++) {
    const a1 = orderedVertices[i];
    const a2 = orderedVertices[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      const b1 = orderedVertices[j];
      const b2 = orderedVertices[(j + 1) % n];
      if (segmentsIntersectNonEndpoint(a1, a2, b1, b2)) {
        hasSelfIntersection = true;
        break;
      }
    }
    if (hasSelfIntersection) break;
  }

  return { isClosed, orderedVertices, hasSelfIntersection };
}

/**
 * Full mathematical polygon analyzer based on exact vertex coordinates.
 */
export function analyzeGeometryPolygon(rawSegments: GridSegment[]): PolygonAnalysis {
  const segments = deduplicateSegments(rawSegments);
  const vertexKeys = new Set<string>();
  for (const s of segments) {
    vertexKeys.add(vertexKey(s.a));
    vertexKeys.add(vertexKey(s.b));
  }

  if (segments.length === 0) {
    return {
      isClosed: false,
      hasSelfIntersection: false,
      vertexCount: 0,
      edgeCount: 0,
      orderedVertices: [],
      sideLengths: [],
      rightAngleCorners: [],
      oppositeSidesParallel: [false, false],
      oppositeSidesEqual: [false, false],
      allSidesEqual: false,
      allAnglesRight: false,
      shapeKind: 'kosong',
      shapeLabel: 'Belum ada garis',
    };
  }

  const loop = extractClosedLoop(segments);
  if (!loop.isClosed || loop.orderedVertices.length !== 4) {
    return {
      isClosed: loop.isClosed,
      hasSelfIntersection: loop.hasSelfIntersection,
      vertexCount: vertexKeys.size,
      edgeCount: segments.length,
      orderedVertices: loop.orderedVertices,
      sideLengths: segments.map((s) => segmentLength(s.a, s.b)),
      rightAngleCorners: [],
      oppositeSidesParallel: [false, false],
      oppositeSidesEqual: [false, false],
      allSidesEqual: false,
      allAnglesRight: false,
      shapeKind: 'terbuka',
      shapeLabel: loop.isClosed ? 'Bukan Segi Empat' : 'Garis Belum Tertutup',
    };
  }

  const v = loop.orderedVertices;
  const sideVecs = [
    vecSub(v[1], v[0]),
    vecSub(v[2], v[1]),
    vecSub(v[3], v[2]),
    vecSub(v[0], v[3]),
  ];
  const sideDistSq = [
    distSquared(v[0], v[1]),
    distSquared(v[1], v[2]),
    distSquared(v[2], v[3]),
    distSquared(v[3], v[0]),
  ];
  const sideLengths = sideDistSq.map((d) => Math.sqrt(d));

  const rightAngleCorners = [
    areVectorsPerpendicular(sideVecs[3], sideVecs[0]),
    areVectorsPerpendicular(sideVecs[0], sideVecs[1]),
    areVectorsPerpendicular(sideVecs[1], sideVecs[2]),
    areVectorsPerpendicular(sideVecs[2], sideVecs[3]),
  ];

  const oppositeSidesParallel: [boolean, boolean] = [
    areVectorsParallel(sideVecs[0], sideVecs[2]),
    areVectorsParallel(sideVecs[1], sideVecs[3]),
  ];

  const oppositeSidesEqual: [boolean, boolean] = [
    sideDistSq[0] === sideDistSq[2],
    sideDistSq[1] === sideDistSq[3],
  ];

  const allSidesEqual =
    sideDistSq[0] === sideDistSq[1] &&
    sideDistSq[1] === sideDistSq[2] &&
    sideDistSq[2] === sideDistSq[3];

  const allAnglesRight = rightAngleCorners.every(Boolean);

  let shapeKind: GeometryShapeKind = 'segi_empat_lain';
  let shapeLabel = 'Segi Empat Lainnya';

  if (!loop.hasSelfIntersection && allAnglesRight && oppositeSidesParallel[0] && oppositeSidesParallel[1]) {
    if (allSidesEqual) {
      shapeKind = 'persegi';
      shapeLabel = 'Persegi';
    } else if (oppositeSidesEqual[0] && oppositeSidesEqual[1]) {
      shapeKind = 'persegi_panjang';
      shapeLabel = 'Persegi Panjang';
    }
  }

  return {
    isClosed: true,
    hasSelfIntersection: loop.hasSelfIntersection,
    vertexCount: 4,
    edgeCount: 4,
    orderedVertices: v,
    sideLengths,
    rightAngleCorners,
    oppositeSidesParallel,
    oppositeSidesEqual,
    allSidesEqual,
    allAnglesRight,
    shapeKind,
    shapeLabel,
  };
}

/**
 * Helper to build 4 closed edges from 4 ordered vertices (used by Virtual Geoboard).
 */
export function polygonEdgesFromVertices(vertices: VertexCoord[]): GridSegment[] {
  if (vertices.length < 3) return [];
  return vertices.map((v, idx) => ({
    id: `geo-${idx}`,
    a: v,
    b: vertices[(idx + 1) % vertices.length],
  }));
}

/**
 * MODULE 2 VALIDATOR: Draw Square ABCD (2 cm x 2 cm)
 */
export function validateSquareABCD(rawSegments: GridSegment[]): ValidationResult {
  const analysis = analyzeGeometryPolygon(rawSegments);

  if (analysis.edgeCount === 0) {
    return {
      passed: false,
      feedbackTitle: 'Papan Grid Masih Kosong',
      feedbackDetail:
        'Mulailah dengan menggambar garis AB sepanjang 2 cm (2 satuan petak), lalu lanjutkan garis tegak lurus BC dan AD sepanjang 2 cm, dan hubungkan D ke C.',
    };
  }

  if (analysis.edgeCount < 4) {
    return {
      passed: false,
      feedbackTitle: `Baru Ada ${analysis.edgeCount} Garis`,
      feedbackDetail:
        'Persegi ABCD membutuhkan 4 sisi tertutup. Lanjutkan menggambar sisa garis tegak lurus sepanjang 2 cm dan hubungkan keempat titiknya.',
    };
  }

  if (!analysis.isClosed || analysis.vertexCount !== 4) {
    return {
      passed: false,
      feedbackTitle: 'Bangun Belum Tertutup Rapi',
      feedbackDetail:
        'Pastikan keempat garis saling bertemu di 4 titik sudut (A, B, C, D) tanpa garis berlebih atau ujung terbuka.',
    };
  }

  if (analysis.hasSelfIntersection) {
    return {
      passed: false,
      feedbackTitle: 'Garis Saling Berpotongan',
      feedbackDetail:
        'Garis sisi persegi tidak boleh menyilang satu sama lain. Hubungkan titik sudut secara berurutan mengelilingi bangun.',
    };
  }

  if (!analysis.allAnglesRight) {
    return {
      passed: false,
      feedbackTitle: 'Sudut Belum Siku-Siku (90°)',
      feedbackDetail:
        'Garis BC dan AD harus tegak lurus (90°) terhadap AB mengikuti garis lurus grid horizontal dan vertikal.',
    };
  }

  if (!analysis.allSidesEqual) {
    return {
      passed: false,
      feedbackTitle: 'Panjang Sisi Belum Sama',
      feedbackDetail: `Bangun yang kamu buat berbentuk persegi panjang (${formatLengthCm(analysis.sideLengths[0])} × ${formatLengthCm(analysis.sideLengths[1])}). Untuk persegi ABCD, semua 4 sisinya harus sama panjang yaitu 2 cm!`,
    };
  }

  const side = analysis.sideLengths[0];
  if (Math.abs(side - 2) > 1e-6) {
    return {
      passed: false,
      feedbackTitle: 'Ukuran Sisi Belum 2 cm',
      feedbackDetail: `Kamu sudah berhasil membuat persegi, tetapi panjang sisinya ${formatLengthCm(side)}. Sesuaikan agar setiap sisi tepat 2 cm (2 satuan grid)!`,
    };
  }

  return {
    passed: true,
    feedbackTitle: 'Luar Biasa! Persegi ABCD Tepat 2 cm!',
    feedbackDetail:
      'Benar karena: (1) keempat sisinya sama panjang 2 cm, (2) keempat sudutnya siku-siku 90°, (3) sisi yang berhadapan sejajar, dan (4) bangun tertutup sempurna tanpa berpotongan.',
  };
}

/**
 * MODULE 3 VALIDATOR: Draw a Rectangle with target dimensions
 */
export function validateDrawRectangle(
  rawSegments: GridSegment[],
  targetLong: number,
  targetShort: number
): ValidationResult {
  const analysis = analyzeGeometryPolygon(rawSegments);

  if (analysis.edgeCount === 0) {
    return {
      passed: false,
      feedbackTitle: 'Belum Ada Garis yang Digambar',
      feedbackDetail: `Gambarlah persegi panjang berukuran ${targetLong} cm × ${targetShort} cm dengan menghubungkan 4 titik di grid.`,
    };
  }

  if (!analysis.isClosed || analysis.vertexCount !== 4) {
    return {
      passed: false,
      feedbackTitle: 'Keempat Titik Belum Terhubung Sempurna',
      feedbackDetail:
        'Pastikan kamu menggambar tepat 4 garis yang saling terhubung membentuk satu bangun tertutup.',
    };
  }

  if (analysis.hasSelfIntersection) {
    return {
      passed: false,
      feedbackTitle: 'Sisi Bangun Saling Menyilang',
      feedbackDetail:
        'Hubungkan titik-titik sudut secara berurutan agar sisi bangun tidak saling berpotongan.',
    };
  }

  if (!analysis.allAnglesRight) {
    return {
      passed: false,
      feedbackTitle: 'Sudut Harus 90 Derajat',
      feedbackDetail:
        'Periksa kembali sudutnya! Setiap sudut persegi panjang wajib tegak lurus 90° mengikuti garis grid.',
    };
  }

  if (analysis.shapeKind === 'persegi') {
    return {
      passed: false,
      feedbackTitle: 'Bangunmu Berbentuk Persegi',
      feedbackDetail: `Kamu menggambar persegi ${formatLengthCm(analysis.sideLengths[0])} × ${formatLengthCm(analysis.sideLengths[1])}. Buatlah persegi panjang dengan panjang ${targetLong} cm dan lebar ${targetShort} cm!`,
    };
  }

  const s1 = analysis.sideLengths[0];
  const s2 = analysis.sideLengths[1];
  const matchesTarget =
    (Math.abs(s1 - targetLong) < 1e-6 && Math.abs(s2 - targetShort) < 1e-6) ||
    (Math.abs(s1 - targetShort) < 1e-6 && Math.abs(s2 - targetLong) < 1e-6);

  if (!matchesTarget) {
    return {
      passed: false,
      feedbackTitle: 'Ukuran Panjang & Lebar Belum Sesuai',
      feedbackDetail: `Ukuran bangunmu saat ini ${formatLengthCm(Math.max(s1, s2))} × ${formatLengthCm(Math.min(s1, s2))}. Target latihan ini adalah ${targetLong} cm × ${targetShort} cm.`,
    };
  }

  return {
    passed: true,
    feedbackTitle: `Sempurna! Persegi Panjang ${targetLong} cm × ${targetShort} cm!`,
    feedbackDetail: `Jawaban benar karena pasangan sisi yang berhadapan sama panjang (${targetLong} cm dan ${targetShort} cm) dan sejajar, serta keempat sudutnya siku-siku 90°.`,
  };
}

/**
 * MODULE 4 VALIDATOR: Complete Square EFGH using displacement vector FG
 * Given E, F, G -> expected H = E + (G - F).
 */
export function computeExpectedPointH(
  pointE: VertexCoord,
  pointF: VertexCoord,
  pointG: VertexCoord
): VertexCoord {
  const displacementFG = vecSub(pointG, pointF);
  return vecAdd(pointE, displacementFG);
}

export function validateCompleteSquareEFGH(params: {
  pointE: VertexCoord;
  pointF: VertexCoord;
  pointG: VertexCoord;
  placedH: VertexCoord | null;
  labeledH: boolean;
  segments: GridSegment[];
}): ValidationResult {
  const { pointE, pointF, pointG, placedH, labeledH, segments } = params;
  const fg = vecSub(pointG, pointF);
  const expectedH = computeExpectedPointH(pointE, pointF, pointG);

  if (!placedH) {
    return {
      passed: false,
      feedbackTitle: 'Titik H Belum Ditentukan',
      feedbackDetail: `Hitung perpindahan dari F ke G (${fg.x} ke kanan, ${fg.y} ke bawah), lalu terapkan perpindahan yang sama dari titik E untuk meletakkan titik H!`,
    };
  }

  if (!sameVertex(placedH, expectedH)) {
    const userDisp = vecSub(placedH, pointE);
    return {
      passed: false,
      feedbackTitle: 'Posisi Titik H Belum Tepat',
      feedbackDetail: `Dari F ke G berpindah ${fg.x} satuan ke kanan dan ${fg.y} satuan ke bawah. Titik yang kamu pilih berpindah (${userDisp.x}, ${userDisp.y}) dari E. Pindahkan titik H agar perpindahan EH sama persis dengan FG!`,
    };
  }

  if (!labeledH) {
    return {
      passed: false,
      feedbackTitle: 'Beri Label Titik H Dulu',
      feedbackDetail:
        'Posisi titik sudah benar! Sekarang tekan tombol "Beri Label H" untuk menandai titik tersebut sebagai H.',
    };
  }

  const deduped = deduplicateSegments(segments);
  const segSet = new Set(deduped.map((s) => segmentKey(s.a, s.b)));
  const hasEF = segSet.has(segmentKey(pointE, pointF));
  const hasFG = segSet.has(segmentKey(pointF, pointG));
  const hasEH = segSet.has(segmentKey(pointE, expectedH));
  const hasHG = segSet.has(segmentKey(expectedH, pointG));

  if (!hasEH || !hasHG) {
    const missing: string[] = [];
    if (!hasEH) missing.push('E ke H');
    if (!hasHG) missing.push('H ke G');
    return {
      passed: false,
      feedbackTitle: 'Hubungkan Garis ke Titik H',
      feedbackDetail: `Titik H sudah tepat dan berlabel! Sekarang hubungkan garis ${missing.join(' dan ')} di atas grid.`,
    };
  }

  if (!hasEF || !hasFG || deduped.length !== 4) {
    return {
      passed: false,
      feedbackTitle: 'Periksa Garis Tambahan',
      feedbackDetail:
        'Pastikan hanya ada 4 sisi persegi EFGH (EF, FG, GH, dan HE) tanpa garis ekstra lainnya.',
    };
  }

  const analysis = analyzeGeometryPolygon(deduped);
  if (analysis.shapeKind !== 'persegi') {
    return {
      passed: false,
      feedbackTitle: 'Sifat Persegi Belum Terpenuhi',
      feedbackDetail:
        'Periksa kembali hubungan sisi dan sudutnya agar keempat sisi sama panjang dan semua sudut 90°.',
    };
  }

  return {
    passed: true,
    feedbackTitle: 'Hebat! Persegi EFGH Lengkap & Akurat!',
    feedbackDetail: `Jawaban benar! Vektor perpindahan FG (${fg.x} kanan, ${fg.y} bawah) diterapkan dari E menghasilkan titik H(${expectedH.x}, ${expectedH.y}). Garis EH sejajar dan sama panjang dengan FG, serta keempat sudutnya tepat 90°.`,
  };
}

/**
 * MODULE 5 VALIDATOR: Parallel & Perpendicular Line Challenge
 */
export function validateLineRelationTask(
  mode: 'parallel' | 'perpendicular',
  userSegment: GridSegment | null,
  refSegment: GridSegment
): ValidationResult {
  if (!userSegment || sameVertex(userSegment.a, userSegment.b)) {
    return {
      passed: false,
      feedbackTitle: 'Gambar Satu Garis Dulu',
      feedbackDetail:
        mode === 'parallel'
          ? 'Hubungkan dua titik pada grid untuk membuat garis yang SEJAJAR dengan garis acuan.'
          : 'Hubungkan dua titik pada grid untuk membuat garis yang TEGAK LURUS (90°) terhadap garis acuan.',
    };
  }

  const refVec = vecSub(refSegment.b, refSegment.a);
  const userVec = vecSub(userSegment.b, userSegment.a);

  if (mode === 'parallel') {
    if (!areVectorsParallel(refVec, userVec)) {
      return {
        passed: false,
        feedbackTitle: 'Garis Belum Sejajar',
        feedbackDetail:
          'Garis sejajar memiliki arah kemiringan yang sama persis dan tidak akan pernah berpotongan jika diperpanjang. Coba buat garis dengan arah yang sama dengan garis acuan!',
      };
    }

    // Ensure it is not collinear/overlapping the reference line itself
    const offsetVec = vecSub(userSegment.a, refSegment.a);
    if (crossProduct(refVec, offsetVec) === 0) {
      return {
        passed: false,
        feedbackTitle: 'Garis Masih Berimpit',
        feedbackDetail:
          'Garismu berada tepat di garis yang sama dengan garis acuan. Geser ke posisi lain agar menjadi dua garis sejajar yang terpisah!',
      };
    }

    return {
      passed: true,
      feedbackTitle: 'Benar! Garis Sejajar Sempurna!',
      feedbackDetail:
        'Kedua garis memiliki arah/kemiringan vektor yang sama dan jarak yang tetap, sehingga tidak akan pernah berpotongan.',
    };
  }

  if (!areVectorsPerpendicular(refVec, userVec)) {
    return {
      passed: false,
      feedbackTitle: 'Garis Belum Tegak Lurus (90°)',
      feedbackDetail:
        'Garis tegak lurus membentuk sudut siku-siku 90°. Jika garis acuan mendatar, buat garis tegak lurus yang vertikal (atau putar arah perpindahannya 90°).',
    };
  }

  return {
    passed: true,
    feedbackTitle: 'Tepat! Garis Tegak Lurus 90°!',
    feedbackDetail:
      'Kedua garis bertemu/berpotongan membentuk sudut siku-siku tepat 90° (hasil kali titik vektornya nol).',
  };
}
