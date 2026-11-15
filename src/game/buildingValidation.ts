import { BUILDING_CHALLENGES, SHAPES_2D } from './buildingData';
import type {
  BuildingChallengeDef,
  PlacedShape,
  Shape2DId,
  ValidationResult,
} from './types';

export function getShapeBounds(shape: PlacedShape) {
  const halfW = shape.type === 'lingkaran' ? (shape.radius ?? shape.width / 2) : shape.width / 2;
  const halfH = shape.type === 'lingkaran' ? (shape.radius ?? shape.height / 2) : shape.height / 2;
  return {
    left: shape.cx - halfW,
    right: shape.cx + halfW,
    top: shape.cy - halfH,
    bottom: shape.cy + halfH,
    halfW,
    halfH,
  };
}

export function getShapeAreaEstimate(shape: PlacedShape): number {
  if (shape.type === 'lingkaran') {
    const r = shape.radius ?? shape.width / 2;
    return Number((Math.PI * r * r).toFixed(2));
  }
  if (shape.type === 'segitiga' || shape.type === 'belah_ketupat') {
    return Number((0.5 * shape.width * shape.height).toFixed(2));
  }
  if (shape.type === 'trapesium') {
    // top width = 0.6 * bottom width
    return Number((((shape.width + shape.width * 0.6) / 2) * shape.height).toFixed(2));
  }
  return Number((shape.width * shape.height).toFixed(2));
}

export function getShapeName(id: Shape2DId): string {
  return SHAPES_2D.find((s) => s.id === id)?.name ?? id;
}

function isHorizontallyAligned(a: PlacedShape, b: PlacedShape, tolerance = 2.6): boolean {
  return Math.abs(a.cx - b.cx) <= tolerance;
}

function isAbove(upper: PlacedShape, lower: PlacedShape, maxGap = 1.8): boolean {
  const u = getShapeBounds(upper);
  const l = getShapeBounds(lower);
  return u.bottom <= l.top + 0.8 && l.top - u.bottom <= maxGap && isHorizontallyAligned(upper, lower, l.halfW + 1.2);
}

function isInsideOrOnWall(inner: PlacedShape, wall: PlacedShape, tol = 0.6): boolean {
  const i = getShapeBounds(inner);
  const w = getShapeBounds(wall);
  return (
    i.left >= w.left - tol &&
    i.right <= w.right + tol &&
    i.top >= w.top - tol &&
    i.bottom <= w.bottom + tol
  );
}

export function validateBuildingChallenge(
  challenge: BuildingChallengeDef,
  shapes: PlacedShape[]
): ValidationResult {
  if (challenge.ruleType === 'creative') {
    if (shapes.length === 0) {
      return {
        passed: false,
        feedbackTitle: 'Kanvas Masih Kosong',
        feedbackDetail:
          'Pilih minimal satu bentuk geometri dari panel sebelah kiri untuk mulai membangun kotamu!',
      };
    }
    const distinctTypes = new Set(shapes.map((s) => s.type)).size;
    return {
      passed: true,
      feedbackTitle: 'Karya Kreatif Luar Biasa!',
      feedbackDetail: `Kamu sudah memasang ${shapes.length} bangun datar dari ${distinctTypes} jenis bentuk geometri. Kamu bisa menyimpannya ke Koleksi Bangunan kapan saja!`,
    };
  }

  const countByType = (t: Shape2DId) => shapes.filter((s) => s.type === t);

  if (challenge.ruleType === 'challenge_rumah') {
    const rects = countByType('persegi_panjang');
    const tris = countByType('segitiga');
    const squares = countByType('persegi');

    if (shapes.length !== 5 || rects.length !== 2 || tris.length !== 1 || squares.length !== 2) {
      return {
        passed: false,
        feedbackTitle: 'Komposisi Bentuk Rumah Belum Tepat',
        feedbackDetail: `Instruksi Rumah: butuh tepat 1 persegi panjang besar (dinding), 1 persegi panjang kecil (pintu), 1 segitiga (atap), dan 2 persegi (jendela). Saat ini ada ${rects.length} persegi panjang, ${tris.length} segitiga, dan ${squares.length} persegi.`,
      };
    }

    // Sort rectangles by area: larger is wall, smaller is door
    const [smallRect, bigRect] = [...rects].sort(
      (a, b) => a.width * a.height - b.width * b.height
    );
    const wallArea = bigRect.width * bigRect.height;
    const doorArea = smallRect.width * smallRect.height;

    if (doorArea >= wallArea * 0.6) {
      return {
        passed: false,
        feedbackTitle: 'Ukuran Pintu Terlalu Besar',
        feedbackDetail:
          'Pastikan ada satu persegi panjang besar untuk dinding dan satu persegi panjang kecil sebagai pintu (perkecil ukuran pintu)!',
      };
    }

    const roof = tris[0];
    if (!isAbove(roof, bigRect, 1.8)) {
      return {
        passed: false,
        feedbackTitle: 'Posisi Atap Belum di Atas Dinding',
        feedbackDetail:
          'Atap rumah berbentuk segitiga harus diletakkan tepat di atas dinding persegi panjang!',
      };
    }

    if (!isInsideOrOnWall(smallRect, bigRect, 0.7)) {
      return {
        passed: false,
        feedbackTitle: 'Posisi Pintu Belum Menempel pada Dinding',
        feedbackDetail:
          'Geser persegi panjang kecil (pintu) ke bagian dalam atau bawah dinding rumah agar rumah terlihat kokoh.',
      };
    }

    const windowsOk = squares.every((sq) => isInsideOrOnWall(sq, bigRect, 0.7));
    if (!windowsOk) {
      return {
        passed: false,
        feedbackTitle: 'Posisi Jendela Masih di Luar Dinding',
        feedbackDetail:
          'Geser kedua persegi (jendela) ke dalam area dinding persegi panjang rumah!',
      };
    }

    return {
      passed: true,
      feedbackTitle: 'Rumah Sempurna Terbangun!',
      feedbackDetail:
        'Tepat sekali! Kamu menggunakan 1 persegi panjang besar untuk dinding, 1 segitiga sebagai atap di atasnya, 2 persegi jendela, dan 1 persegi panjang kecil sebagai pintu.',
    };
  }

  if (challenge.ruleType === 'challenge_sekolah') {
    if (shapes.length < 4) {
      return {
        passed: false,
        feedbackTitle: 'Bentuk Masih Kurang dari 4',
        feedbackDetail: `Sekolah membutuhkan minimal 4 bentuk geometri. Saat ini baru terpasang ${shapes.length} bentuk.`,
      };
    }

    const rects = countByType('persegi_panjang');
    const traps = countByType('trapesium');
    const squares = countByType('persegi');

    if (rects.length < 1 || traps.length < 1) {
      return {
        passed: false,
        feedbackTitle: 'Gunakan Persegi Panjang & Trapesium',
        feedbackDetail:
          'Bangunan sekolah harus memiliki minimal 1 persegi panjang (gedung utama) dan 1 trapesium (atap sekolah).',
      };
    }

    const mainBuilding = [...rects].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const hasRoofAbove = traps.some((t) => isAbove(t, mainBuilding, 2));
    if (!hasRoofAbove) {
      return {
        passed: false,
        feedbackTitle: 'Posisi Atap Trapesium Belum Tepat',
        feedbackDetail:
          'Letakkan atap berbentuk trapesium tepat di atas bangunan utama persegi panjang!',
      };
    }

    if (squares.length < 1 && rects.length < 2) {
      return {
        passed: false,
        feedbackTitle: 'Tambahkan Jendela atau Pintu Sekolah',
        feedbackDetail:
          'Tambahkan jendela berbentuk persegi atau pintu masuk pada bangunan utama sekolah!',
      };
    }

    return {
      passed: true,
      feedbackTitle: 'Sekolah Ceria Selesai Dibangun!',
      feedbackDetail: `Hebat! Kamu membangun sekolah dengan ${shapes.length} bentuk geometri lengkap dengan atap trapesium, gedung persegi panjang, jendela, dan pintu.`,
    };
  }

  if (challenge.ruleType === 'challenge_rumah_sakit') {
    const rects = countByType('persegi_panjang');
    const squares = countByType('persegi');
    if (rects.length < 3 || squares.length < 2) {
      return {
        passed: false,
        feedbackTitle: 'Komponen Rumah Sakit Belum Lengkap',
        feedbackDetail:
          'Butuh 1 persegi panjang besar (gedung), 2 persegi panjang kecil untuk membentuk simbol medis (+), dan minimal 2 persegi (jendela).',
      };
    }
    return {
      passed: true,
      feedbackTitle: 'Rumah Sakit Siap Melayani Kota!',
      feedbackDetail:
        'Mantap! Gedung utama persegi panjang, jendela persegi, dan simbol medis (+) dari gabungan persegi panjang telah terpasang.',
    };
  }

  if (challenge.ruleType === 'challenge_jembatan') {
    const rects = countByType('persegi_panjang');
    const tris = countByType('segitiga');
    const traps = countByType('trapesium');
    if (rects.length < 1 || tris.length < 2 || traps.length < 1) {
      return {
        passed: false,
        feedbackTitle: 'Struktur Jembatan Belum Lengkap',
        feedbackDetail:
          'Struktur jembatan memerlukan minimal 1 persegi panjang (jalan), 2 segitiga (rangka), dan 1 trapesium (pondasi).',
      };
    }
    return {
      passed: true,
      feedbackTitle: 'Jembatan Kuat Berhasil Dibangun!',
      feedbackDetail:
        'Luar biasa! Gabungan persegi panjang, segitiga penguat, dan trapesium pondasi membuat jembatan kokoh.',
    };
  }

  if (challenge.ruleType === 'challenge_menara') {
    const rects = countByType('persegi_panjang');
    const tris = countByType('segitiga');
    const circles = countByType('lingkaran');
    const squares = countByType('persegi');

    if (rects.length < 1 || tris.length < 1 || circles.length < 1 || squares.length < 1) {
      return {
        passed: false,
        feedbackTitle: 'Komponen Menara Belum Lengkap',
        feedbackDetail:
          'Menara membutuhkan badan persegi panjang, atap segitiga, dekorasi lingkaran, dan dekorasi persegi.',
      };
    }

    const body = [...rects].sort((a, b) => b.height - a.height)[0];
    if (body.height < body.width) {
      return {
        passed: false,
        feedbackTitle: 'Badan Menara Masih Mendatar',
        feedbackDetail:
          'Perbesar tinggi persegi panjang (atau putar 90°) agar badan menara berdiri lebih tinggi daripada lebarnya!',
      };
    }

    if (!tris.some((t) => isAbove(t, body, 2))) {
      return {
        passed: false,
        feedbackTitle: 'Atap Segitiga Belum di Puncak Menara',
        feedbackDetail:
          'Pindahkan atap segitiga tepat ke atas badan menara persegi panjang!',
      };
    }

    return {
      passed: true,
      feedbackTitle: 'Menara Penjaga Berdiri Megah!',
      feedbackDetail:
        'Sempurna! Badan persegi panjang tinggi, atap segitiga di puncak, jam lingkaran, dan jendela persegi tersusun rapi.',
    };
  }

  if (challenge.ruleType === 'challenge_kastil') {
    const distinctTypes = new Set(shapes.map((s) => s.type));
    if (distinctTypes.size < 5) {
      return {
        passed: false,
        feedbackTitle: `Baru ${distinctTypes.size} dari 5 Jenis Bentuk`,
        feedbackDetail:
          'Kastil harus menggabungkan minimal 5 jenis bentuk geometri berbeda (misal: persegi, persegi panjang, segitiga, trapesium, dan lingkaran/segi lima/segi enam).',
      };
    }
    if (shapes.length < 6) {
      return {
        passed: false,
        feedbackTitle: 'Kastil Butuh Lebih Banyak Bagian',
        feedbackDetail:
          'Tambahkan minimal 6 bentuk pada kanvas agar kastil memiliki gerbang, dinding, dan menara!',
      };
    }
    return {
      passed: true,
      feedbackTitle: 'Kastil Agung Berhasil Dibangun!',
      feedbackDetail: `Fantastis! Kamu memadukan ${distinctTypes.size} jenis bentuk geometri berbeda menjadi kastil yang megah.`,
    };
  }

  return {
    passed: true,
    feedbackTitle: 'Bangunan Berhasil Diperiksa!',
    feedbackDetail: 'Bagus sekali!',
  };
}

export function getBuildingContextualHint(
  challengeId: string,
  shapes: PlacedShape[]
): string {
  const challenge = BUILDING_CHALLENGES.find((c) => c.id === challengeId);
  if (!challenge) return 'Pilih bentuk dari panel sebelah kiri untuk mulai membangun.';

  const count = (t: Shape2DId) => shapes.filter((s) => s.type === t).length;

  if (challenge.ruleType === 'challenge_rumah') {
    if (count('persegi_panjang') === 0) {
      return 'Mulai dengan memilih Persegi Panjang besar sebagai dinding utama rumah!';
    }
    if (count('segitiga') === 0) {
      return 'Atap rumah biasanya dapat dibuat menggunakan bentuk Segitiga. Coba tambahkan Segitiga di atas dinding!';
    }
    if (count('persegi') < 2) {
      return 'Tambahkan 2 bentuk Persegi sebagai jendela di dalam dinding rumah.';
    }
    if (count('persegi_panjang') < 2) {
      return 'Tambahkan 1 Persegi Panjang kecil sebagai pintu rumah!';
    }
    const result = validateBuildingChallenge(challenge, shapes);
    return result.feedbackDetail;
  }

  if (challenge.ruleType === 'challenge_sekolah') {
    if (count('trapesium') === 0) {
      return 'Untuk atap sekolah yang lebar, pilih bentuk Trapesium dan letakkan di atas gedung Persegi Panjang!';
    }
    if (shapes.length < 4) {
      return `Saat ini baru ada ${shapes.length} bentuk. Tambahkan jendela Persegi atau pintu agar minimal 4 bentuk!`;
    }
  }

  if (challenge.ruleType === 'challenge_kastil') {
    const distinct = new Set(shapes.map((s) => s.type)).size;
    if (distinct < 5) {
      return `Kamu sudah memakai ${distinct} jenis bentuk. Tambahkan ${5 - distinct} jenis bentuk lain seperti Lingkaran, Trapesium, atau Segi Enam!`;
    }
  }

  return challenge.hints[0] ?? 'Periksa ukuran dan susunan bentuk pada kanvas!';
}
