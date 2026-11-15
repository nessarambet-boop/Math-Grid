import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeGeometryPolygon,
  computeExpectedPointH,
  polygonEdgesFromVertices,
  validateCompleteSquareEFGH,
  validateDrawRectangle,
  validateLineRelationTask,
  validateSquareABCD,
  type GridSegment,
} from './geometryMath';

test('analyzeGeometryPolygon detects axis-aligned and tilted squares and rejects open or crossed shapes', () => {
  // 2x2 square
  const sq = polygonEdgesFromVertices([
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 3 },
    { x: 1, y: 3 },
  ]);
  const sqRes = analyzeGeometryPolygon(sq);
  assert.equal(sqRes.shapeKind, 'persegi');
  assert.equal(sqRes.allSidesEqual, true);
  assert.equal(sqRes.allAnglesRight, true);

  // Tilted square EFGH: E(1,3), F(4,2), G(5,5), H(2,6)
  const tilted = polygonEdgesFromVertices([
    { x: 1, y: 3 },
    { x: 4, y: 2 },
    { x: 5, y: 5 },
    { x: 2, y: 6 },
  ]);
  const tiltedRes = analyzeGeometryPolygon(tilted);
  assert.equal(tiltedRes.shapeKind, 'persegi');
  assert.equal(tiltedRes.allAnglesRight, true);
  assert.equal(tiltedRes.allSidesEqual, true);

  // Bowtie (self-intersecting)
  const bowtie = polygonEdgesFromVertices([
    { x: 1, y: 1 },
    { x: 3, y: 3 },
    { x: 3, y: 1 },
    { x: 1, y: 3 },
  ]);
  const bowtieRes = analyzeGeometryPolygon(bowtie);
  assert.equal(bowtieRes.hasSelfIntersection, true);
  assert.equal(bowtieRes.shapeKind, 'segi_empat_lain');
});

test('validateSquareABCD validates exact 2cm x 2cm square and diagnoses errors clearly', () => {
  const valid2x2 = polygonEdgesFromVertices([
    { x: 2, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 4 },
    { x: 2, y: 4 },
  ]);
  assert.equal(validateSquareABCD(valid2x2).passed, true);

  // 3x3 square should fail with size explanation
  const wrongSize = polygonEdgesFromVertices([
    { x: 1, y: 1 },
    { x: 4, y: 1 },
    { x: 4, y: 4 },
    { x: 1, y: 4 },
  ]);
  const sizeRes = validateSquareABCD(wrongSize);
  assert.equal(sizeRes.passed, false);
  assert.match(sizeRes.feedbackDetail, /2 cm/);

  // 2x3 rectangle should fail
  const rect = polygonEdgesFromVertices([
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 4 },
    { x: 1, y: 4 },
  ]);
  assert.equal(validateSquareABCD(rect).passed, false);
});

test('validateDrawRectangle validates target dimensions and rejects squares', () => {
  const rect4x2 = polygonEdgesFromVertices([
    { x: 1, y: 1 },
    { x: 5, y: 1 },
    { x: 5, y: 3 },
    { x: 1, y: 3 },
  ]);
  assert.equal(validateDrawRectangle(rect4x2, 4, 2).passed, true);

  // Rotated 2x4 also valid
  const rect2x4 = polygonEdgesFromVertices([
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 5 },
    { x: 1, y: 5 },
  ]);
  assert.equal(validateDrawRectangle(rect2x4, 4, 2).passed, true);

  // Wrong size
  assert.equal(validateDrawRectangle(rect2x4, 5, 2).passed, false);
});

test('validateCompleteSquareEFGH enforces exact FG displacement vector for H and connections', () => {
  const E = { x: 1, y: 3 };
  const F = { x: 4, y: 2 };
  const G = { x: 5, y: 5 }; // +1 right, +3 down from F
  const expectedH = computeExpectedPointH(E, F, G);
  assert.deepEqual(expectedH, { x: 2, y: 6 });

  const baseEdges: GridSegment[] = [
    { id: 'ef', a: E, b: F },
    { id: 'fg', a: F, b: G },
  ];

  // Near-miss H (2,5) must be strictly rejected
  const nearMiss = validateCompleteSquareEFGH({
    pointE: E,
    pointF: F,
    pointG: G,
    placedH: { x: 2, y: 5 },
    labeledH: true,
    segments: [
      ...baseEdges,
      { id: 'eh', a: E, b: { x: 2, y: 5 } },
      { id: 'hg', a: { x: 2, y: 5 }, b: G },
    ],
  });
  assert.equal(nearMiss.passed, false);

  // Exact H without label must prompt labeling
  const unlabeled = validateCompleteSquareEFGH({
    pointE: E,
    pointF: F,
    pointG: G,
    placedH: expectedH,
    labeledH: false,
    segments: baseEdges,
  });
  assert.equal(unlabeled.passed, false);

  // Complete labeled and connected EFGH passes
  const valid = validateCompleteSquareEFGH({
    pointE: E,
    pointF: F,
    pointG: G,
    placedH: expectedH,
    labeledH: true,
    segments: [
      ...baseEdges,
      { id: 'eh', a: E, b: expectedH },
      { id: 'hg', a: expectedH, b: G },
    ],
  });
  assert.equal(valid.passed, true);
});

test('validateLineRelationTask verifies parallel and perpendicular vectors accurately', () => {
  const ref: GridSegment = { id: 'ref', a: { x: 1, y: 2 }, b: { x: 5, y: 2 } };

  // Parallel non-collinear
  assert.equal(
    validateLineRelationTask('parallel', { id: 'u1', a: { x: 2, y: 4 }, b: { x: 6, y: 4 } }, ref).passed,
    true
  );
  // Collinear overlapping should fail
  assert.equal(
    validateLineRelationTask('parallel', { id: 'u2', a: { x: 0, y: 2 }, b: { x: 3, y: 2 } }, ref).passed,
    false
  );
  // Perpendicular
  assert.equal(
    validateLineRelationTask('perpendicular', { id: 'u3', a: { x: 3, y: 0 }, b: { x: 3, y: 5 } }, ref).passed,
    true
  );
  // Diagonal fails perpendicular
  assert.equal(
    validateLineRelationTask('perpendicular', { id: 'u4', a: { x: 2, y: 1 }, b: { x: 4, y: 4 } }, ref).passed,
    false
  );
});
