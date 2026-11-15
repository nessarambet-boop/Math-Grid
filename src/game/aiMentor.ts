import { getBuildingContextualHint } from './buildingValidation';
import { getTotalStars } from './storage';
import { WorldId, type GameProgress, type PlacedShape } from './types';

export interface MentorContext {
  world: WorldId;
  levelId?: string;
  levelTitle?: string;
  lastError?: string;
  placedShapes?: PlacedShape[];
  studentQuestion?: string;
  progress: GameProgress;
}

export interface MentorReply {
  explanation: string;
  source: 'local' | 'gemini';
}

export function buildLocalMentorHint(ctx: MentorContext): string {
  const totalStars = getTotalStars(ctx.progress);
  const q = (ctx.studentQuestion ?? '').toLowerCase();

  if (ctx.world === WorldId.BUILDING && ctx.levelId) {
    if (q.includes('lingkaran') || q.includes('radius') || q.includes('jari')) {
      return 'Lingkaran dibuat dari titik pusat (x, y) dan jari-jari (r). Diameternya selalu 2 kali jari-jari, cocok untuk jam menara atau jendela bulat!';
    }
    if (q.includes('bangun ruang') || q.includes('3d') || q.includes('kubus') || q.includes('balok')) {
      return 'Bangun ruang punya isi (volume)! Kubus tersusun dari 6 persegi, balok dari persegi panjang, sedangkan bangun datar seperti persegi & segitiga digambar rata di grid 2D.';
    }
    if (ctx.placedShapes) {
      return getBuildingContextualHint(ctx.levelId, ctx.placedShapes);
    }
  }

  if (ctx.lastError) {
    return `${ctx.lastError} Tip HIGAYON: Periksa kembali jumlah sisi, panjangnya dalam satuan grid, dan sudut siku-siku 90°.`;
  }

  switch (ctx.world) {
    case WorldId.LEARN:
      return `Kamu sudah punya ${totalStars} bintang! Di Learn World, amati garis mendatar & tegak pada grid (1 petak = 1 cm) serta sudut siku-siku 90°.`;
    case WorldId.PRACTICE:
      return 'Untuk menggambar Persegi, pastikan panjang dan lebarnya sama. Untuk Persegi Panjang, sisi yang berhadapan sama panjang tetapi panjang ≠ lebar.';
    case WorldId.PUZZLE:
      return 'Perhatikan petak terkunci dan rintangan batu abu-abu! Hitung luas dari jumlah petak dan keliling dari garis tepi luarnya.';
    case WorldId.CHALLENGE:
      return 'Baca soal dengan tenang—ingat: Luas = panjang × lebar, dan Keliling = 2 × (panjang + lebar).';
    case WorldId.BUILDING:
      return 'Pilih bentuk geometri 2D dari panel kiri, geser ke posisinya, lalu gunakan Putar atau Ukuran untuk menyusun bangunan impianmu!';
  }
}

export async function askAIMentor(ctx: MentorContext): Promise<MentorReply> {
  const localHint = buildLocalMentorHint(ctx);

  // If browser knows it's offline, respond immediately with local rule engine
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { explanation: localHint, source: 'local' };
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 7000);

    const shapeSummary = ctx.placedShapes
      ? ctx.placedShapes.map((s) => `${s.type}(${s.width}x${s.height})`).join(', ')
      : '';

    const res = await fetch('/api/mentor/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        world: ctx.world,
        levelTitle: ctx.levelTitle ?? '',
        lastError: ctx.lastError ?? '',
        placedShapesSummary: shapeSummary,
        totalStars: getTotalStars(ctx.progress),
        question: ctx.studentQuestion ?? '',
        localFallback: localHint,
      }),
    });

    window.clearTimeout(timer);

    if (!res.ok) {
      return { explanation: localHint, source: 'local' };
    }

    const data = (await res.json()) as { explanation?: string; source?: 'local' | 'gemini' };
    if (data.explanation?.trim()) {
      return {
        explanation: data.explanation.trim(),
        source: data.source ?? 'local',
      };
    }
    return { explanation: localHint, source: 'local' };
  } catch {
    return { explanation: localHint, source: 'local' };
  }
}
