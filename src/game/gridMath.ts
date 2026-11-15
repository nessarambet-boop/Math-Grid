import type {
  GridCoord,
  GridSelectionAnalysis,
  PracticeTask,
  PuzzleLevel,
  ValidationResult,
  ChallengeQuestion,
} from './types';

export function coordKey(c: GridCoord): string {
  return `${c.col},${c.row}`;
}

export function parseCoordKey(key: string): GridCoord {
  const [colStr, rowStr] = key.split(',');
  return { col: Number(colStr), row: Number(rowStr) };
}

export function deduplicateCoords(coords: GridCoord[]): GridCoord[] {
  const seen = new Set<string>();
  const out: GridCoord[] = [];
  for (const c of coords) {
    const k = coordKey(c);
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ col: c.col, row: c.row });
    }
  }
  return out;
}

export function coordsToSet(coords: GridCoord[]): Set<string> {
  return new Set(coords.map(coordKey));
}

export function isSameCoord(a: GridCoord, b: GridCoord): boolean {
  return a.col === b.col && a.row === b.row;
}

export function buildRectCoords(
  start: GridCoord,
  end: GridCoord,
  blockedSet?: Set<string>
): GridCoord[] {
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const result: GridCoord[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const k = `${c},${r}`;
      if (!blockedSet || !blockedSet.has(k)) {
        result.push({ col: c, row: r });
      }
    }
  }
  return result;
}

/**
 * Computes 4-connected components among selected cells.
 */
export function getConnectedComponents(coords: GridCoord[]): GridCoord[][] {
  const unique = deduplicateCoords(coords);
  const map = new Map<string, GridCoord>();
  for (const c of unique) {
    map.set(coordKey(c), c);
  }
  const visited = new Set<string>();
  const components: GridCoord[][] = [];

  for (const start of unique) {
    const startKey = coordKey(start);
    if (visited.has(startKey)) continue;
    const queue: GridCoord[] = [start];
    const comp: GridCoord[] = [];
    visited.add(startKey);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      comp.push(cur);
      const neighbors: GridCoord[] = [
        { col: cur.col + 1, row: cur.row },
        { col: cur.col - 1, row: cur.row },
        { col: cur.col, row: cur.row + 1 },
        { col: cur.col, row: cur.row - 1 },
      ];
      for (const n of neighbors) {
        const nk = coordKey(n);
        if (map.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push(n);
        }
      }
    }
    components.push(comp);
  }

  return components;
}

/**
 * Analyzes selected grid cells to determine if they form a Square (Persegi),
 * Rectangle (Persegi Panjang), or an irregular shape, plus exact Area and Perimeter.
 */
export function analyzeGridSelection(coords: GridCoord[]): GridSelectionAnalysis {
  const unique = deduplicateCoords(coords);
  if (unique.length === 0) {
    return {
      count: 0,
      shapeKind: 'kosong',
      shapeLabel: 'Belum ada petak',
      isContiguous: false,
      isSolidRectangle: false,
      isSquare: false,
      isNonSquareRectangle: false,
      minCol: 0,
      maxCol: 0,
      minRow: 0,
      maxRow: 0,
      width: 0,
      height: 0,
      area: 0,
      perimeter: 0,
    };
  }

  let minCol = Infinity;
  let maxCol = -Infinity;
  let minRow = Infinity;
  let maxRow = -Infinity;
  const cellSet = new Set<string>();

  for (const c of unique) {
    if (c.col < minCol) minCol = c.col;
    if (c.col > maxCol) maxCol = c.col;
    if (c.row < minRow) minRow = c.row;
    if (c.row > maxRow) maxRow = c.row;
    cellSet.add(coordKey(c));
  }

  const width = maxCol - minCol + 1;
  const height = maxRow - minRow + 1;
  const area = unique.length;

  // Compute exact outer perimeter by counting exposed edges of each unit square
  let perimeter = 0;
  for (const c of unique) {
    if (!cellSet.has(`${c.col + 1},${c.row}`)) perimeter += 1;
    if (!cellSet.has(`${c.col - 1},${c.row}`)) perimeter += 1;
    if (!cellSet.has(`${c.col},${c.row + 1}`)) perimeter += 1;
    if (!cellSet.has(`${c.col},${c.row - 1}`)) perimeter += 1;
  }

  const components = getConnectedComponents(unique);
  const isContiguous = components.length === 1;
  const isSolidRectangle = isContiguous && area === width * height;
  const isSquare = isSolidRectangle && width === height;
  const isNonSquareRectangle = isSolidRectangle && width !== height;

  let shapeKind: GridSelectionAnalysis['shapeKind'] = 'tidak_beraturan';
  let shapeLabel = 'Bentuk Tidak Beraturan';

  if (isSquare) {
    shapeKind = 'persegi';
    shapeLabel = 'Persegi';
  } else if (isNonSquareRectangle) {
    shapeKind = 'persegi_panjang';
    shapeLabel = 'Persegi Panjang';
  }

  return {
    count: unique.length,
    shapeKind,
    shapeLabel,
    isContiguous,
    isSolidRectangle,
    isSquare,
    isNonSquareRectangle,
    minCol,
    maxCol,
    minRow,
    maxRow,
    width,
    height,
    area,
    perimeter,
  };
}

export function validatePracticeTask(
  task: PracticeTask,
  selected: GridCoord[]
): ValidationResult {
  const analysis = analyzeGridSelection(selected);

  if (analysis.count === 0) {
    return {
      passed: false,
      feedbackTitle: 'Grid Masih Kosong',
      feedbackDetail: 'Ketuk atau seret petak di atas grid untuk menggambar bangunmu terlebih dahulu!',
    };
  }

  if (!analysis.isSolidRectangle) {
    return {
      passed: false,
      feedbackTitle: 'Bangun Belum Rapi',
      feedbackDetail:
        'Pastikan seluruh petak terhubung penuh membentuk persegi atau persegi panjang tanpa celah berlubang.',
    };
  }

  switch (task.ruleType) {
    case 'exact_square': {
      const side = task.targetWidth ?? 3;
      if (analysis.isSquare && analysis.width === side) {
        return {
          passed: true,
          feedbackTitle: 'Hebat! Persegi Tepat!',
          feedbackDetail: `Kamu berhasil menggambar persegi ${side} × ${side} dengan luas ${analysis.area} petak satuan dan keliling ${analysis.perimeter} satuan.`,
        };
      }
      return {
        passed: false,
        feedbackTitle: 'Hampir Benar!',
        feedbackDetail: `Targetnya adalah Persegi berukuran ${side} × ${side}. Saat ini bangunmu berukuran ${analysis.width} × ${analysis.height}.`,
      };
    }

    case 'exact_rectangle': {
      const tw = task.targetWidth ?? 4;
      const th = task.targetHeight ?? 2;
      const matchesOrientation =
        (analysis.width === tw && analysis.height === th) ||
        (analysis.width === th && analysis.height === tw);
      if (analysis.isSolidRectangle && matchesOrientation) {
        return {
          passed: true,
          feedbackTitle: 'Mantap! Persegi Panjang Sempurna!',
          feedbackDetail: `Bangun berukuran ${analysis.width} × ${analysis.height} memiliki luas ${analysis.area} dan keliling ${analysis.perimeter}.`,
        };
      }
      return {
        passed: false,
        feedbackTitle: 'Cek Ukurannya Lagi!',
        feedbackDetail: `Buat persegi panjang berukuran ${tw} × ${th} (boleh mendatar atau tegak). Punyamu sekarang ${analysis.width} × ${analysis.height}.`,
      };
    }

    case 'target_area': {
      const targetArea = task.targetArea ?? 12;
      if (analysis.area === targetArea) {
        return {
          passed: true,
          feedbackTitle: 'Tepat Sekali!',
          feedbackDetail: `Luas bangun ${analysis.width} × ${analysis.height} adalah ${analysis.area} petak satuan. Keren!`,
        };
      }
      return {
        passed: false,
        feedbackTitle: 'Luas Belum Sesuai',
        feedbackDetail: `Target luasnya ${targetArea} petak satuan, sedangkan bangunmu memiliki luas ${analysis.area} petak satuan.`,
      };
    }

    case 'target_perimeter': {
      const targetPerimeter = task.targetPerimeter ?? 16;
      if (analysis.perimeter === targetPerimeter) {
        return {
          passed: true,
          feedbackTitle: 'Luar Biasa!',
          feedbackDetail: `Keliling bangun ${analysis.width} × ${analysis.height} tepat ${analysis.perimeter} satuan!`,
        };
      }
      return {
        passed: false,
        feedbackTitle: 'Keliling Belum Tepat',
        feedbackDetail: `Keliling dihitung dari tepi luarnya. Target ${targetPerimeter} satuan, punyamu ${analysis.perimeter} satuan.`,
      };
    }

    case 'square_with_area': {
      const targetArea = task.targetArea ?? 16;
      if (!analysis.isSquare) {
        return {
          passed: false,
          feedbackTitle: 'Harus Berbentuk Persegi',
          feedbackDetail: `Panjang dan lebarnya harus sama besar! Bangunmu berukuran ${analysis.width} × ${analysis.height}.`,
        };
      }
      if (analysis.area !== targetArea) {
        return {
          passed: false,
          feedbackTitle: 'Luas Persegi Belum Tepat',
          feedbackDetail: `Persegi sudah terbentuk, tetapi luasnya ${analysis.area}. Coba ubah sisi agar luasnya ${targetArea}.`,
        };
      }
      return {
        passed: true,
        feedbackTitle: 'Brilian! Master Persegi!',
        feedbackDetail: `Persegi ${analysis.width} × ${analysis.height} memiliki luas ${analysis.area} petak satuan!`,
      };
    }

    case 'nonsquare_rect_with_area': {
      const targetArea = task.targetArea ?? 18;
      if (!analysis.isNonSquareRectangle) {
        return {
          passed: false,
          feedbackTitle: 'Harus Persegi Panjang (Bukan Persegi)',
          feedbackDetail: 'Pilih panjang dan lebar yang berbeda ukuran ya!',
        };
      }
      if (analysis.area !== targetArea) {
        return {
          passed: false,
          feedbackTitle: 'Luas Belum Tepat',
          feedbackDetail: `Luas bangunmu saat ini ${analysis.area}. Targetnya adalah ${targetArea} petak satuan.`,
        };
      }
      return {
        passed: true,
        feedbackTitle: 'Sempurna! Penjelajah Grid!',
        feedbackDetail: `Persegi panjang ${analysis.width} × ${analysis.height} memiliki luas ${analysis.area} petak satuan.`,
      };
    }
  }
}

export function validatePuzzleLevel(
  puzzle: PuzzleLevel,
  selected: GridCoord[]
): ValidationResult {
  const unique = deduplicateCoords(selected);
  const selectedSet = coordsToSet(unique);
  const obstacleSet = coordsToSet(puzzle.obstacleCells);

  // Check if any selected cell overlaps an obstacle
  for (const c of unique) {
    if (obstacleSet.has(coordKey(c))) {
      return {
        passed: false,
        feedbackTitle: 'Menabrak Batu Rintangan!',
        feedbackDetail: 'Petak yang dipilih tidak boleh menimpa batu karang di grid.',
      };
    }
  }

  // Ensure all locked cells are included
  for (const locked of puzzle.lockedCells) {
    if (!selectedSet.has(coordKey(locked))) {
      return {
        passed: false,
        feedbackTitle: 'Petak Awal Belum Lengkap',
        feedbackDetail: 'Pertahankan semua petak emas yang sudah ada di papan.',
      };
    }
  }

  switch (puzzle.puzzleRule) {
    case 'complete_square_4x4': {
      const analysis = analyzeGridSelection(unique);
      if (analysis.isSquare && analysis.width === 4) {
        return {
          passed: true,
          feedbackTitle: 'Persegi 4 × 4 Tersusun Utuh!',
          feedbackDetail: 'Semua 16 petak membentuk persegi yang sempurna dan kokoh.',
        };
      }
      return {
        passed: false,
        feedbackTitle: 'Belum Jadi Persegi 4 × 4',
        feedbackDetail: `Saat ini ada ${analysis.count} petak (${analysis.shapeLabel}). Lengkapi hingga membentuk persegi 4 × 4 penuh!`,
      };
    }

    case 'area_avoid_obstacle_12': {
      const analysis = analyzeGridSelection(unique);
      if (analysis.isSolidRectangle && analysis.area === 12) {
        return {
          passed: true,
          feedbackTitle: 'Jalur Aman Terbentuk!',
          feedbackDetail: `Kamu membangun ${analysis.shapeLabel} ${analysis.width} × ${analysis.height} dengan luas 12 tanpa mengenai batu!`,
        };
      }
      return {
        passed: false,
        feedbackTitle: 'Cek Bentuk & Luasnya',
        feedbackDetail: `Bangun harus utuh (persegi/persegi panjang) dengan luas tepat 12 petak. Punyamu sekarang luas ${analysis.area}.`,
      };
    }

    case 'enclose_fountain_perim_14': {
      const analysis = analyzeGridSelection(unique);
      const fountain = puzzle.fountainCell;
      const includesFountain = fountain ? selectedSet.has(coordKey(fountain)) : true;
      if (!includesFountain) {
        return {
          passed: false,
          feedbackTitle: 'Air Mancur Harus di Dalam Taman',
          feedbackDetail: 'Pastikan petak air mancur berada di dalam area persegi panjang yang kamu buat.',
        };
      }
      if (analysis.isSolidRectangle && analysis.perimeter === 14) {
        return {
          passed: true,
          feedbackTitle: 'Taman Air Mancur Selesai!',
          feedbackDetail: `Taman ${analysis.width} × ${analysis.height} mengelilingi air mancur dengan keliling tepat 14 satuan!`,
        };
      }
      return {
        passed: false,
        feedbackTitle: 'Keliling Taman Belum 14',
        feedbackDetail: `Saat ini keliling bangunmu ${analysis.perimeter} satuan. Coba ukuran seperti 4 × 3 atau 5 × 2!`,
      };
    }

    case 'twin_squares_cover_markers': {
      const components = getConnectedComponents(unique);
      if (components.length !== 2) {
        return {
          passed: false,
          feedbackTitle: 'Harus Ada 2 Persegi Terpisah',
          feedbackDetail: `Sekarang ada ${components.length} kelompok petak. Buat 2 persegi 2 × 2 yang tidak saling bersentuhan sisi.`,
        };
      }
      const analyses = components.map((comp) => analyzeGridSelection(comp));
      const both2x2 = analyses.every((a) => a.isSquare && a.width === 2);
      if (!both2x2) {
        return {
          passed: false,
          feedbackTitle: 'Ukuran Kembar Belum 2 × 2',
          feedbackDetail: 'Pastikan kedua pulau kecil berbentuk persegi tepat berukuran 2 × 2.',
        };
      }
      const allMarkersCovered = puzzle.targetMarkers.every((m) =>
        selectedSet.has(coordKey(m))
      );
      if (!allMarkersCovered) {
        return {
          passed: false,
          feedbackTitle: 'Kristal Belum Tertutup',
          feedbackDetail: 'Setiap persegi 2 × 2 harus menutupi posisi kristal di grid.',
        };
      }
      return {
        passed: true,
        feedbackTitle: 'Dua Persegi Kembar Berhasil!',
        feedbackDetail: 'Kedua kristal berhasil diamankan dengan dua persegi 2 × 2 yang terpisah!',
      };
    }

    case 'mystery_rect_5x3': {
      const analysis = analyzeGridSelection(unique);
      const matches =
        analysis.isNonSquareRectangle &&
        analysis.area === 15 &&
        Math.abs(analysis.width - analysis.height) === 2;
      if (matches) {
        return {
          passed: true,
          feedbackTitle: 'Misteri Terpecahkan!',
          feedbackDetail: `Benar! ${analysis.width} × ${analysis.height} memiliki selisih sisi 2 dan luas 15 petak satuan.`,
        };
      }
      return {
        passed: false,
        feedbackTitle: 'Belum Cocok dengan Petunjuk',
        feedbackDetail:
          'Cari dua bilangan yang berselisih 2 dan jika dikalikan hasilnya 15 (misalnya panjang dan lebarnya)!',
      };
    }
  }
}

export function validateChallengeQuestion(
  question: ChallengeQuestion,
  selected: GridCoord[],
  numericAnswer?: number
): ValidationResult {
  if (question.mode === 'answer') {
    if (numericAnswer === undefined || Number.isNaN(numericAnswer)) {
      return {
        passed: false,
        feedbackTitle: 'Pilih Jawaban Dulu',
        feedbackDetail: 'Pilih salah satu angka jawaban yang tersedia.',
      };
    }
    if (numericAnswer === question.correctAnswer) {
      return {
        passed: true,
        feedbackTitle: 'Jawaban Benar!',
        feedbackDetail: question.explanation,
      };
    }
    return {
      passed: false,
      feedbackTitle: 'Kurang Tepat',
      feedbackDetail: question.explanation,
    };
  }

  // Draw mode reuses practice task semantics
  const pseudoTask: PracticeTask = {
    id: question.id,
    title: 'Tantangan',
    instruction: question.prompt,
    gridCols: question.gridCols,
    gridRows: question.gridRows,
    ruleType: question.ruleType ?? 'target_area',
    targetWidth: question.targetWidth,
    targetHeight: question.targetHeight,
    targetArea: question.targetArea,
    targetPerimeter: question.targetPerimeter,
    hint: question.explanation,
    tutorIntro: '',
  };
  return validatePracticeTask(pseudoTask, selected);
}

export function calculateStars(attempts: number, usedHint: boolean): number {
  if (attempts <= 1 && !usedHint) return 3;
  if (attempts <= 2) return 2;
  return 1;
}
