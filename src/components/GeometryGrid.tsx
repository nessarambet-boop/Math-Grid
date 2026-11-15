import React, { useMemo, useRef, useState } from 'react';
import {
  formatLengthCm,
  sameVertex,
  segmentKey,
  segmentLength,
  vecSub,
  type GridSegment,
  type VertexCoord,
} from '../game/geometryMath';
import { sfx } from '../game/sound';

export interface LabeledPoint {
  coord: VertexCoord;
  label: string;
  color?: string;
}

export interface DisplacementGuide {
  from: VertexCoord;
  to: VertexCoord;
  dxLabel: string;
  dyLabel: string;
  color?: string;
}

export interface StyledSegment extends GridSegment {
  color?: string;
  locked?: boolean;
  parallelGroup?: 1 | 2;
}

interface GeometryGridProps {
  cols: number; // number of unit squares horizontally (vertices 0..cols)
  rows: number; // number of unit squares vertically (vertices 0..rows)
  mode: 'draw-lines' | 'geoboard' | 'place-h-then-draw';
  segments?: StyledSegment[];
  onAddSegment?: (a: VertexCoord, b: VertexCoord) => void;
  selectedSegmentId?: string | null;
  onSelectSegment?: (segmentId: string | null) => void;
  geoboardVertices?: VertexCoord[];
  onMoveGeoboardVertex?: (index: number, next: VertexCoord) => void;
  placedH?: VertexCoord | null;
  onPlaceH?: (coord: VertexCoord) => void;
  placeHActive?: boolean;
  labeledPoints?: LabeledPoint[];
  rightAngleCorners?: { vertex: VertexCoord; prev: VertexCoord; next: VertexCoord }[];
  showEdgeLengths?: boolean;
  displacementGuides?: DisplacementGuide[];
  unitLabel?: string;
  readOnly?: boolean;
  testId?: string;
}

export const GeometryGrid: React.FC<GeometryGridProps> = ({
  cols,
  rows,
  mode,
  segments = [],
  onAddSegment,
  selectedSegmentId,
  onSelectSegment,
  geoboardVertices = [],
  onMoveGeoboardVertex,
  placedH,
  onPlaceH,
  placeHActive = false,
  labeledPoints = [],
  rightAngleCorners = [],
  showEdgeLengths = true,
  displacementGuides = [],
  unitLabel = '1 petak = 1 cm',
  readOnly = false,
  testId = 'geometry-grid',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [lineStart, setLineStart] = useState<VertexCoord | null>(null);
  const [hoverVertex, setHoverVertex] = useState<VertexCoord | null>(null);
  const [draggingLine, setDraggingLine] = useState(false);
  const [draggingGeoIdx, setDraggingGeoIdx] = useState<number | null>(null);

  const cellSize = 58;
  const pad = 42;
  const widthPx = pad * 2 + cols * cellSize;
  const heightPx = pad * 2 + rows * cellSize;

  const toPx = (v: VertexCoord) => ({
    x: pad + v.x * cellSize,
    y: pad + v.y * cellSize,
  });

  const getNearestVertex = (clientX: number, clientY: number): VertexCoord | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const svgX = ((clientX - rect.left) / rect.width) * widthPx;
    const svgY = ((clientY - rect.top) / rect.height) * heightPx;
    const gx = Math.round((svgX - pad) / cellSize);
    const gy = Math.round((svgY - pad) / cellSize);
    if (gx < 0 || gx > cols || gy < 0 || gy > rows) return null;
    return { x: gx, y: gy };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly) return;
    const v = getNearestVertex(e.clientX, e.clientY);
    if (!v) return;

    if (mode === 'geoboard') {
      const idx = geoboardVertices.findIndex((gv) => sameVertex(gv, v));
      if (idx !== -1) {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setDraggingGeoIdx(idx);
        sfx.tileTap(idx);
      }
      return;
    }

    if (mode === 'place-h-then-draw' && placeHActive) {
      onPlaceH?.(v);
      sfx.tileTap(2);
      return;
    }

    // draw-lines mode (supports both tap-tap and drag-drop)
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (lineStart && !sameVertex(lineStart, v)) {
      onAddSegment?.(lineStart, v);
      setLineStart(null);
      setHoverVertex(null);
      setDraggingLine(false);
      return;
    }
    if (lineStart && sameVertex(lineStart, v)) {
      setLineStart(null);
      setDraggingLine(false);
      return;
    }

    setLineStart(v);
    setHoverVertex(v);
    setDraggingLine(true);
    sfx.tileTap(0);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly) return;
    const v = getNearestVertex(e.clientX, e.clientY);
    if (!v) return;

    if (mode === 'geoboard' && draggingGeoIdx !== null) {
      if (!sameVertex(geoboardVertices[draggingGeoIdx], v)) {
        // Prevent collapsing two geoboard pins onto the exact same vertex
        const occupied = geoboardVertices.some(
          (gv, idx) => idx !== draggingGeoIdx && sameVertex(gv, v)
        );
        if (!occupied) {
          onMoveGeoboardVertex?.(draggingGeoIdx, v);
        }
      }
      return;
    }

    if (draggingLine || lineStart) {
      setHoverVertex(v);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode === 'geoboard') {
      setDraggingGeoIdx(null);
      return;
    }

    if (draggingLine && lineStart) {
      const v = getNearestVertex(e.clientX, e.clientY) ?? hoverVertex;
      if (v && !sameVertex(lineStart, v)) {
        onAddSegment?.(lineStart, v);
        setLineStart(null);
        setHoverVertex(null);
      }
      setDraggingLine(false);
    }
  };

  const previewLength = useMemo(() => {
    if (!lineStart || !hoverVertex || sameVertex(lineStart, hoverVertex)) return null;
    return segmentLength(lineStart, hoverVertex);
  }, [lineStart, hoverVertex]);

  const geoboardEdges: StyledSegment[] = useMemo(() => {
    if (mode !== 'geoboard' || geoboardVertices.length < 3) return [];
    return geoboardVertices.map((v, i) => ({
      id: `geo-${i}`,
      a: v,
      b: geoboardVertices[(i + 1) % geoboardVertices.length],
      color: '#0D9488',
    }));
  }, [mode, geoboardVertices]);

  const renderedSegments = mode === 'geoboard' ? geoboardEdges : segments;

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        ref={svgRef}
        data-testid={testId}
        viewBox={`0 0 ${widthPx} ${heightPx}`}
        className={`w-full max-w-[520px] select-none touch-none rounded-2xl border-2 border-slate-200 bg-white shadow-sm ${
          readOnly ? 'cursor-default' : 'cursor-crosshair'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setDraggingGeoIdx(null);
          setDraggingLine(false);
        }}
        role="img"
        aria-label={`Grid koordinat geometri ${cols} kali ${rows}`}
      >
        <rect x="0" y="0" width={widthPx} height={heightPx} rx="14" fill="#F8FAFC" />

        {/* Coordinate Axis Labels */}
        {Array.from({ length: cols + 1 }, (_, x) => (
          <text
            key={`xlabel-${x}`}
            x={pad + x * cellSize}
            y={pad - 18}
            textAnchor="middle"
            className="font-mono-num fill-slate-500 text-[12px] font-bold"
          >
            {x}
          </text>
        ))}
        {Array.from({ length: rows + 1 }, (_, y) => (
          <text
            key={`ylabel-${y}`}
            x={pad - 20}
            y={pad + y * cellSize + 4}
            textAnchor="middle"
            className="font-mono-num fill-slate-500 text-[12px] font-bold"
          >
            {y}
          </text>
        ))}

        {/* Horizontal & Vertical Grid Lines */}
        {Array.from({ length: cols + 1 }, (_, x) => (
          <line
            key={`vline-${x}`}
            x1={pad + x * cellSize}
            y1={pad}
            x2={pad + x * cellSize}
            y2={pad + rows * cellSize}
            stroke="#CBD5E1"
            strokeWidth="1.6"
          />
        ))}
        {Array.from({ length: rows + 1 }, (_, y) => (
          <line
            key={`hline-${y}`}
            x1={pad}
            y1={pad + y * cellSize}
            x2={pad + cols * cellSize}
            y2={pad + y * cellSize}
            stroke="#CBD5E1"
            strokeWidth="1.6"
          />
        ))}

        {/* Geoboard translucent rubber-band fill */}
        {mode === 'geoboard' && geoboardVertices.length >= 3 && (
          <polygon
            points={geoboardVertices
              .map((v) => {
                const p = toPx(v);
                return `${p.x},${p.y}`;
              })
              .join(' ')}
            fill="#14B8A6"
            fillOpacity="0.16"
          />
        )}

        {/* Displacement Vector Guides (Modul 4 animation/hint) */}
        {displacementGuides.map((g, i) => {
          const pFrom = toPx(g.from);
          const pCorner = toPx({ x: g.to.x, y: g.from.y });
          const pTo = toPx(g.to);
          const col = g.color ?? '#0284C7';
          return (
            <g key={`disp-${i}`} className="pointer-events-none">
              <line
                x1={pFrom.x}
                y1={pFrom.y}
                x2={pCorner.x}
                y2={pCorner.y}
                stroke={col}
                strokeWidth="3"
                strokeDasharray="6 5"
              />
              <line
                x1={pCorner.x}
                y1={pCorner.y}
                x2={pTo.x}
                y2={pTo.y}
                stroke={col}
                strokeWidth="3"
                strokeDasharray="6 5"
              />
              <rect
                x={(pFrom.x + pCorner.x) / 2 - 28}
                y={pFrom.y - 30}
                width="56"
                height="18"
                rx="6"
                fill={col}
              />
              <text
                x={(pFrom.x + pCorner.x) / 2}
                y={pFrom.y - 17}
                textAnchor="middle"
                fill="#FFFFFF"
                className="font-mono-num text-[10px] font-bold"
              >
                {g.dxLabel}
              </text>
              <rect
                x={pCorner.x + 6}
                y={(pCorner.y + pTo.y) / 2 - 9}
                width="64"
                height="18"
                rx="6"
                fill={col}
              />
              <text
                x={pCorner.x + 38}
                y={(pCorner.y + pTo.y) / 2 + 4}
                textAnchor="middle"
                fill="#FFFFFF"
                className="font-mono-num text-[10px] font-bold"
              >
                {g.dyLabel}
              </text>
            </g>
          );
        })}

        {/* 90-Degree Right Angle Symbols */}
        {rightAngleCorners.map((rc, idx) => {
          const pv = toPx(rc.vertex);
          const u = vecSub(rc.prev, rc.vertex);
          const w = vecSub(rc.next, rc.vertex);
          const uLen = Math.hypot(u.x, u.y) || 1;
          const wLen = Math.hypot(w.x, w.y) || 1;
          const size = 14;
          const ux = (u.x / uLen) * size;
          const uy = (u.y / uLen) * size;
          const wx = (w.x / wLen) * size;
          const wy = (w.y / wLen) * size;
          const p1 = { x: pv.x + ux, y: pv.y + uy };
          const p2 = { x: pv.x + ux + wx, y: pv.y + uy + wy };
          const p3 = { x: pv.x + wx, y: pv.y + wy };

          return (
            <polyline
              key={`ra-${idx}`}
              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
              fill="none"
              stroke="#EA580C"
              strokeWidth="2.5"
              className="pointer-events-none"
            />
          );
        })}

        {/* Drawn Segments */}
        {renderedSegments.map((seg) => {
          const p1 = toPx(seg.a);
          const p2 = toPx(seg.b);
          const isSelected = selectedSegmentId === seg.id;
          const strokeCol = isSelected
            ? '#EA580C'
            : seg.color ?? (seg.locked ? '#0369A1' : '#0D9488');
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const len = segmentLength(seg.a, seg.b);

          return (
            <g key={seg.id || segmentKey(seg.a, seg.b)}>
              {/* Invisible thick hit target for line selection */}
              {!readOnly && onSelectSegment && mode !== 'geoboard' && (
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="transparent"
                  strokeWidth="18"
                  className="cursor-pointer"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    sfx.click();
                    onSelectSegment(isSelected ? null : seg.id);
                  }}
                />
              )}

              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={strokeCol}
                strokeWidth={isSelected ? 6.5 : 4.8}
                strokeLinecap="round"
                className="pointer-events-none"
              />

              {/* Parallel arrow mark */}
              {seg.parallelGroup && (
                <circle
                  cx={midX}
                  cy={midY}
                  r="5"
                  fill={seg.parallelGroup === 1 ? '#0284C7' : '#D97706'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="pointer-events-none"
                />
              )}
            </g>
          );
        })}

        {/* Active Drag / Tap Preview Line */}
        {lineStart && hoverVertex && !sameVertex(lineStart, hoverVertex) && (
          <g className="pointer-events-none">
            <line
              x1={toPx(lineStart).x}
              y1={toPx(lineStart).y}
              x2={toPx(hoverVertex).x}
              y2={toPx(hoverVertex).y}
              stroke="#F59E0B"
              strokeWidth="4.5"
              strokeDasharray="7 5"
              strokeLinecap="round"
            />
            {previewLength !== null && (
              <g>
                <rect
                  x={(toPx(lineStart).x + toPx(hoverVertex).x) / 2 - 22}
                  y={(toPx(lineStart).y + toPx(hoverVertex).y) / 2 - 12}
                  width="44"
                  height="21"
                  rx="6"
                  fill="#B45309"
                />
                <text
                  x={(toPx(lineStart).x + toPx(hoverVertex).x) / 2}
                  y={(toPx(lineStart).y + toPx(hoverVertex).y) / 2 + 2}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  className="font-mono-num text-[11px] font-bold"
                >
                  {formatLengthCm(previewLength)}
                </text>
              </g>
            )}
          </g>
        )}

        {/* Intersection Grid Pegs (Vertices) */}
        {Array.from({ length: rows + 1 }, (_, y) =>
          Array.from({ length: cols + 1 }, (_, x) => {
            const p = toPx({ x, y });
            const isStart = lineStart && lineStart.x === x && lineStart.y === y;
            const isGeoPin =
              mode === 'geoboard' &&
              geoboardVertices.some((gv) => gv.x === x && gv.y === y);
            const isPlacedH = placedH && placedH.x === x && placedH.y === y;

            return (
              <g key={`v-${x}-${y}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isGeoPin || isStart || isPlacedH ? 8 : 4.5}
                  fill={
                    isStart
                      ? '#F59E0B'
                      : isGeoPin
                      ? '#F59E0B'
                      : isPlacedH
                      ? '#EA580C'
                      : '#64748B'
                  }
                  stroke="#FFFFFF"
                  strokeWidth={isGeoPin || isStart || isPlacedH ? 2.5 : 1.5}
                  className="pointer-events-none"
                />
              </g>
            );
          })
        )}

        {/* Segment Length Badges (rendered above grid pegs so dots never obscure text) */}
        {showEdgeLengths &&
          renderedSegments.map((seg) => {
            const p1 = toPx(seg.a);
            const p2 = toPx(seg.b);
            const isSelected = selectedSegmentId === seg.id;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const len = segmentLength(seg.a, seg.b);
            return (
              <g key={`len-${seg.id || segmentKey(seg.a, seg.b)}`} className="pointer-events-none">
                <rect
                  x={midX - 21}
                  y={midY - 11}
                  width="42"
                  height="20"
                  rx="6"
                  fill={isSelected ? '#EA580C' : '#0F172A'}
                  fillOpacity="0.92"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  className="font-mono-num text-[11px] font-bold"
                >
                  {formatLengthCm(len)}
                </text>
              </g>
            );
          })}

        {/* Vertex Labels (A, B, C, D or E, F, G, H) */}
        {labeledPoints.map((lp, idx) => {
          const p = toPx(lp.coord);
          return (
            <g key={`lbl-${lp.label}-${idx}`} className="pointer-events-none">
              <circle
                cx={p.x}
                cy={p.y}
                r="13"
                fill={lp.color ?? '#0F172A'}
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              <text
                x={p.x}
                y={p.y + 4.5}
                textAnchor="middle"
                fill="#FFFFFF"
                className="font-display text-[13px] font-bold"
              >
                {lp.label}
              </text>
            </g>
          );
        })}

        {/* Scale Caption */}
        <text
          x={widthPx - 14}
          y={heightPx - 10}
          textAnchor="end"
          className="fill-slate-500 text-[11px] font-semibold"
        >
          {unitLabel}
        </text>
      </svg>
    </div>
  );
};
