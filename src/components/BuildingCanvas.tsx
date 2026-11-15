import React, { useRef, useState } from 'react';
import {
  CANVAS_GRID_COLS,
  CANVAS_GRID_ROWS,
  SHAPES_2D,
} from '../game/buildingData';
import type { PlacedShape, Shape2DId } from '../game/types';
import { Shape2DFigure } from './Shape2DRenderer';

const CELL_PX = 60;
const SVG_W = CANVAS_GRID_COLS * CELL_PX; // 720
const SVG_H = CANVAS_GRID_ROWS * CELL_PX; // 540

interface BuildingCanvasProps {
  shapes: PlacedShape[];
  selectedIds: string[];
  multiSelectMode: boolean;
  snapToGrid: boolean;
  pendingPlaceType: Shape2DId | null;
  locationTheme: 'geometry-village' | 'shape-city' | 'castle-island' | 'creative-zone';
  onSelectShape: (id: string | null, toggle?: boolean) => void;
  onPlaceShapeAt: (type: Shape2DId, cx: number, cy: number) => void;
  onMoveStart?: () => void;
  onMoveShape: (id: string, cx: number, cy: number) => void;
  onMoveCommit?: () => void;
}

export const BuildingCanvas: React.FC<BuildingCanvasProps> = ({
  shapes,
  selectedIds,
  multiSelectMode,
  snapToGrid,
  pendingPlaceType,
  locationTheme,
  onSelectShape,
  onPlaceShapeAt,
  onMoveStart,
  onMoveShape,
  onMoveCommit,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  const clientToGrid = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { gx: 6, gy: 4.5 };
    const rect = svg.getBoundingClientRect();
    const xPx = ((clientX - rect.left) / rect.width) * SVG_W;
    const yPx = ((clientY - rect.top) / rect.height) * SVG_H;
    return {
      gx: xPx / CELL_PX,
      gy: yPx / CELL_PX,
    };
  };

  const snapValue = (v: number, maxVal: number) => {
    const snapped = snapToGrid ? Math.round(v * 2) / 2 : Number(v.toFixed(1));
    return Math.min(maxVal - 0.5, Math.max(0.5, snapped));
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Only triggered when clicking background grid (shapes stopPropagation)
    const { gx, gy } = clientToGrid(e.clientX, e.clientY);
    if (pendingPlaceType) {
      onPlaceShapeAt(
        pendingPlaceType,
        snapValue(gx, CANVAS_GRID_COLS),
        snapValue(gy, CANVAS_GRID_ROWS)
      );
    } else if (!e.shiftKey && !multiSelectMode) {
      onSelectShape(null, false);
    }
  };

  const handleShapePointerDown = (
    e: React.PointerEvent<SVGGElement>,
    shape: PlacedShape
  ) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const toggle = e.shiftKey || multiSelectMode;
    onSelectShape(shape.id, toggle);
    const { gx, gy } = clientToGrid(e.clientX, e.clientY);
    setDragState({
      id: shape.id,
      offsetX: shape.cx - gx,
      offsetY: shape.cy - gy,
      moved: false,
    });
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState) return;
    const { gx, gy } = clientToGrid(e.clientX, e.clientY);
    const nextCx = snapValue(gx + dragState.offsetX, CANVAS_GRID_COLS);
    const nextCy = snapValue(gy + dragState.offsetY, CANVAS_GRID_ROWS);
    if (!dragState.moved) {
      onMoveStart?.();
      setDragState((prev) => (prev ? { ...prev, moved: true } : null));
    }
    onMoveShape(dragState.id, nextCx, nextCy);
  };

  const handleSvgPointerUp = () => {
    if (dragState?.moved) {
      onMoveCommit?.();
    }
    setDragState(null);
  };

  const skyTint =
    locationTheme === 'castle-island'
      ? '#EEF2FF'
      : locationTheme === 'shape-city'
      ? '#F0F9FF'
      : locationTheme === 'creative-zone'
      ? '#FFFBEB'
      : '#F0FDF4';

  const groundFill =
    locationTheme === 'castle-island'
      ? '#CBD5E1'
      : locationTheme === 'shape-city'
      ? '#E2E8F0'
      : '#BBF7D0';

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-2 border-teal-200 bg-white shadow-inner">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className={`block w-full h-auto touch-none select-none ${
          pendingPlaceType ? 'cursor-crosshair' : 'cursor-default'
        }`}
        data-testid="building-canvas"
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerCancel={handleSvgPointerUp}
      >
        {/* Sky & Horizon Background */}
        <rect x={0} y={0} width={SVG_W} height={SVG_H} fill={skyTint} />
        <rect
          x={0}
          y={SVG_H - CELL_PX * 1.25}
          width={SVG_W}
          height={CELL_PX * 1.25}
          fill={groundFill}
          opacity={0.75}
        />

        {/* Grid Lines */}
        <g stroke="#94A3B8" strokeOpacity={0.35} strokeWidth={1}>
          {Array.from({ length: CANVAS_GRID_COLS + 1 }).map((_, c) => (
            <line key={`vc-${c}`} x1={c * CELL_PX} y1={0} x2={c * CELL_PX} y2={SVG_H} />
          ))}
          {Array.from({ length: CANVAS_GRID_ROWS + 1 }).map((_, r) => (
            <line key={`hr-${r}`} x1={0} y1={r * CELL_PX} x2={SVG_W} y2={r * CELL_PX} />
          ))}
        </g>

        {/* Sub-grid 0.5 markers when snapToGrid is active */}
        {snapToGrid && (
          <g fill="#64748B" fillOpacity={0.22} pointerEvents="none">
            {Array.from({ length: CANVAS_GRID_COLS }).map((_, c) =>
              Array.from({ length: CANVAS_GRID_ROWS }).map((__, r) => (
                <circle
                  key={`dot-${c}-${r}`}
                  cx={(c + 0.5) * CELL_PX}
                  cy={(r + 0.5) * CELL_PX}
                  r={1.5}
                />
              ))
            )}
          </g>
        )}

        {/* Axis Unit Numbers */}
        <g fill="#64748B" fontSize="10" fontWeight="600" pointerEvents="none">
          {Array.from({ length: CANVAS_GRID_COLS }).map((_, c) => (
            <text key={`ax-${c}`} x={c * CELL_PX + 4} y={12}>
              {c}
            </text>
          ))}
        </g>

        {/* Placed 2D Shapes */}
        {shapes.map((shape) => {
          const isSelected = selectedIds.includes(shape.id);
          const isPrimarySelected = selectedIds[selectedIds.length - 1] === shape.id;
          const xPx = shape.cx * CELL_PX;
          const yPx = shape.cy * CELL_PX;
          const wPx = shape.width * CELL_PX;
          const hPx = shape.height * CELL_PX;
          const rPx =
            shape.type === 'lingkaran'
              ? (shape.radius ?? shape.width / 2) * CELL_PX
              : undefined;
          const def = SHAPES_2D.find((s) => s.id === shape.type);

          return (
            <g
              key={shape.id}
              transform={`translate(${xPx}, ${yPx}) rotate(${shape.rotation})`}
              onPointerDown={(e) => handleShapePointerDown(e, shape)}
              className="cursor-grab active:cursor-grabbing"
              data-shape-id={shape.id}
              data-shape-type={shape.type}
              data-selected={isSelected ? 'true' : 'false'}
            >
              <Shape2DFigure
                type={shape.type}
                widthPx={wPx}
                heightPx={hPx}
                radiusPx={rPx}
                fill={shape.color}
                stroke={isSelected ? '#0F766E' : '#1E293B'}
                strokeWidth={isSelected ? 3.5 : 2.2}
                showGeometryGuides={isSelected && shape.type === 'lingkaran'}
              />

              {/* Selection Outline & Handles */}
              {isSelected && (
                <g pointerEvents="none">
                  {shape.type === 'lingkaran' && rPx ? (
                    <>
                      <circle
                        cx={0}
                        cy={0}
                        r={rPx + 6}
                        fill="none"
                        stroke={isPrimarySelected ? '#0D9488' : '#0284C7'}
                        strokeWidth={2.5}
                        strokeDasharray="6 4"
                      />
                      <circle cx={rPx + 6} cy={0} r={4} fill="#0D9488" stroke="#FFFFFF" strokeWidth={1.5} />
                      <circle cx={-(rPx + 6)} cy={0} r={4} fill="#0D9488" stroke="#FFFFFF" strokeWidth={1.5} />
                    </>
                  ) : (
                    <>
                      <rect
                        x={-wPx / 2 - 5}
                        y={-hPx / 2 - 5}
                        width={wPx + 10}
                        height={hPx + 10}
                        rx={6}
                        fill="none"
                        stroke={isPrimarySelected ? '#0D9488' : '#0284C7'}
                        strokeWidth={2.5}
                        strokeDasharray="6 4"
                      />
                      <rect x={-wPx / 2 - 8} y={-hPx / 2 - 8} width={7} height={7} rx={2} fill="#0D9488" stroke="#FFFFFF" strokeWidth={1.2} />
                      <rect x={wPx / 2 + 1} y={-hPx / 2 - 8} width={7} height={7} rx={2} fill="#0D9488" stroke="#FFFFFF" strokeWidth={1.2} />
                      <rect x={-wPx / 2 - 8} y={hPx / 2 + 1} width={7} height={7} rx={2} fill="#0D9488" stroke="#FFFFFF" strokeWidth={1.2} />
                      <rect x={wPx / 2 + 1} y={hPx / 2 + 1} width={7} height={7} rx={2} fill="#0D9488" stroke="#FFFFFF" strokeWidth={1.2} />
                    </>
                  )}
                  <circle cx={0} cy={0} r={4.5} fill="#0F172A" stroke="#FFFFFF" strokeWidth={1.5} />
                </g>
              )}

              {/* Subtle shape label when space allows */}
              {shape.label && wPx >= 50 && hPx >= 36 && (
                <text
                  x={0}
                  y={hPx >= 110 && shape.type === 'persegi_panjang' ? -hPx / 2 + 18 : 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#0F172A"
                  fillOpacity={0.75}
                  pointerEvents="none"
                >
                  {shape.label}
                </text>
              )}
              {!shape.label && isSelected && (
                <title>{def?.name ?? shape.type}</title>
              )}
            </g>
          );
        })}
      </svg>

      {pendingPlaceType && (
        <div className="bg-teal-700 px-3 py-1.5 text-center text-xs font-bold text-white">
          Klik di mana saja pada grid untuk menaruh bentuk:{' '}
          {SHAPES_2D.find((s) => s.id === pendingPlaceType)?.name}
        </div>
      )}
    </div>
  );
};
