import React, { useMemo, useRef, useState } from 'react';
import {
  analyzeGridSelection,
  buildRectCoords,
  coordKey,
  coordsToSet,
} from '../game/gridMath';
import type { GridCoord } from '../game/types';
import { sfx } from '../game/sound';

export type GridDrawMode = 'toggle' | 'rect';

interface InteractiveGridProps {
  cols: number;
  rows: number;
  selectedCells: GridCoord[];
  onChangeCells?: (next: GridCoord[]) => void;
  lockedCells?: GridCoord[];
  obstacleCells?: GridCoord[];
  targetMarkers?: GridCoord[];
  fountainCell?: GridCoord;
  drawMode?: GridDrawMode;
  readOnly?: boolean;
  showDimensions?: boolean;
  showCellNumbers?: boolean;
  highlightPerimeterProgress?: number; // 0..1 animated perimeter walk
  accentColor?: 'amber' | 'teal' | 'sky';
  testId?: string;
}

export const InteractiveGrid: React.FC<InteractiveGridProps> = ({
  cols,
  rows,
  selectedCells,
  onChangeCells,
  lockedCells = [],
  obstacleCells = [],
  targetMarkers = [],
  fountainCell,
  drawMode = 'toggle',
  readOnly = false,
  showDimensions = true,
  showCellNumbers = false,
  highlightPerimeterProgress,
  accentColor = 'amber',
  testId = 'math-grid',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragAction, setDragAction] = useState<'add' | 'remove' | null>(null);
  const [rectStart, setRectStart] = useState<GridCoord | null>(null);
  const [rectHover, setRectHover] = useState<GridCoord | null>(null);

  const cellSize = 56;
  const padLeft = 36;
  const padTop = 36;
  const padRight = 42;
  const padBottom = 30;
  const widthPx = padLeft + cols * cellSize + padRight;
  const heightPx = padTop + rows * cellSize + padBottom;

  const lockedSet = useMemo(() => coordsToSet(lockedCells), [lockedCells]);
  const obstacleSet = useMemo(() => coordsToSet(obstacleCells), [obstacleCells]);
  const markerSet = useMemo(() => coordsToSet(targetMarkers), [targetMarkers]);
  const selectedSet = useMemo(() => coordsToSet(selectedCells), [selectedCells]);

  const previewCells = useMemo(() => {
    if (drawMode === 'rect' && rectStart && rectHover) {
      return buildRectCoords(rectStart, rectHover, obstacleSet);
    }
    return null;
  }, [drawMode, rectStart, rectHover, obstacleSet]);

  const activeCells = previewCells ?? selectedCells;
  const activeSet = useMemo(() => coordsToSet(activeCells), [activeCells]);
  const analysis = useMemo(() => analyzeGridSelection(activeCells), [activeCells]);

  const fillColors = {
    amber: { fill: '#FBBF24', stroke: '#D97706', text: '#78350F' },
    teal: { fill: '#2DD4BF', stroke: '#0F766E', text: '#134E4A' },
    sky: { fill: '#38BDF8', stroke: '#0284C7', text: '#0C4A6E' },
  }[accentColor];

  const getCellFromPointer = (clientX: number, clientY: number): GridCoord | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const svgX = ((clientX - rect.left) / rect.width) * widthPx;
    const svgY = ((clientY - rect.top) / rect.height) * heightPx;
    const col = Math.floor((svgX - padLeft) / cellSize);
    const row = Math.floor((svgY - padTop) / cellSize);
    if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
    return { col, row };
  };

  const applyToggleCell = (coord: GridCoord, mode: 'add' | 'remove') => {
    if (!onChangeCells || readOnly) return;
    const key = coordKey(coord);
    if (obstacleSet.has(key) || lockedSet.has(key)) return;

    const exists = selectedSet.has(key);
    if (mode === 'add' && !exists) {
      sfx.tileTap(coord.col + coord.row);
      onChangeCells([...selectedCells, coord]);
    } else if (mode === 'remove' && exists) {
      sfx.tileErase();
      onChangeCells(selectedCells.filter((c) => coordKey(c) !== key));
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onChangeCells) return;
    const cell = getCellFromPointer(e.clientX, e.clientY);
    if (!cell) return;
    const key = coordKey(cell);
    if (obstacleSet.has(key)) {
      sfx.error();
      return;
    }

    e.currentTarget.setPointerCapture?.(e.pointerId);

    if (drawMode === 'rect') {
      setRectStart(cell);
      setRectHover(cell);
      sfx.tileTap(0);
    } else {
      if (lockedSet.has(key)) return;
      const mode = selectedSet.has(key) ? 'remove' : 'add';
      setDragAction(mode);
      applyToggleCell(cell, mode);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onChangeCells) return;
    const cell = getCellFromPointer(e.clientX, e.clientY);
    if (!cell) return;

    if (drawMode === 'rect' && rectStart) {
      if (!rectHover || rectHover.col !== cell.col || rectHover.row !== cell.row) {
        setRectHover(cell);
      }
    } else if (dragAction) {
      applyToggleCell(cell, dragAction);
    }
  };

  const commitPointerEnd = () => {
    if (drawMode === 'rect' && rectStart && rectHover && onChangeCells) {
      const rectCells = buildRectCoords(rectStart, rectHover, obstacleSet);
      // Merge locked cells so locked tiles stay preserved
      const merged = [...lockedCells];
      const mergedKeys = coordsToSet(merged);
      for (const c of rectCells) {
        if (!mergedKeys.has(coordKey(c))) {
          merged.push(c);
          mergedKeys.add(coordKey(c));
        }
      }
      sfx.tileTap(merged.length % 6);
      onChangeCells(merged);
    }
    setDragAction(null);
    setRectStart(null);
    setRectHover(null);
  };

  // Perimeter path for solid rectangles when animated or highlighted
  const solidBox =
    analysis.isSolidRectangle && analysis.count > 0
      ? {
          x: padLeft + analysis.minCol * cellSize,
          y: padTop + analysis.minRow * cellSize,
          w: analysis.width * cellSize,
          h: analysis.height * cellSize,
        }
      : null;

  const perimeterTotalPx = solidBox ? 2 * (solidBox.w + solidBox.h) : 0;

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        ref={svgRef}
        data-testid={testId}
        viewBox={`0 0 ${widthPx} ${heightPx}`}
        className={`w-full max-w-[520px] select-none touch-none rounded-2xl border-2 border-slate-200 bg-white shadow-sm ${
          readOnly ? 'cursor-default' : 'cursor-pointer'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={commitPointerEnd}
        onPointerCancel={commitPointerEnd}
        role="img"
        aria-label={`Grid matematika interaktif ukuran ${cols} kali ${rows}`}
      >
        {/* Subtle parchment-blueprint background */}
        <rect x="0" y="0" width={widthPx} height={heightPx} rx="14" fill="#F8FAFC" />

        {/* Column index labels */}
        {Array.from({ length: cols }, (_, c) => (
          <text
            key={`col-${c}`}
            x={padLeft + c * cellSize + cellSize / 2}
            y={padTop - 12}
            textAnchor="middle"
            className="font-mono-num fill-slate-500 text-[13px] font-bold"
          >
            {c + 1}
          </text>
        ))}

        {/* Row index labels */}
        {Array.from({ length: rows }, (_, r) => (
          <text
            key={`row-${r}`}
            x={padLeft - 14}
            y={padTop + r * cellSize + cellSize / 2 + 5}
            textAnchor="middle"
            className="font-mono-num fill-slate-500 text-[13px] font-bold"
          >
            {r + 1}
          </text>
        ))}

        {/* Grid Cells */}
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const key = `${c},${r}`;
            const x = padLeft + c * cellSize;
            const y = padTop + r * cellSize;
            const isLocked = lockedSet.has(key);
            const isObstacle = obstacleSet.has(key);
            const isSelected = activeSet.has(key);
            const isMarker = markerSet.has(key);
            const isFountain =
              fountainCell && fountainCell.col === c && fountainCell.row === r;

            let cellFill = '#FFFFFF';
            let cellStroke = '#CBD5E1';
            if (isObstacle) {
              cellFill = '#E2E8F0';
              cellStroke = '#94A3B8';
            } else if (isLocked) {
              cellFill = '#F59E0B';
              cellStroke = '#B45309';
            } else if (isSelected) {
              cellFill = fillColors.fill;
              cellStroke = fillColors.stroke;
            }

            const selectedIndex = showCellNumbers
              ? activeCells.findIndex((item) => item.col === c && item.row === r) + 1
              : 0;

            return (
              <g key={key}>
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  rx="8"
                  fill={cellFill}
                  stroke={cellStroke}
                  strokeWidth={isSelected || isLocked ? 2.5 : 1.5}
                />

                {/* Obstacle Rock Illustration */}
                {isObstacle && (
                  <g transform={`translate(${x + 12}, ${y + 14})`}>
                    <path
                      d="M4 24 L10 8 L22 5 L30 16 L28 26 Z"
                      fill="#64748B"
                      stroke="#334155"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path d="M12 12 L20 10 L17 18 Z" fill="#94A3B8" />
                  </g>
                )}

                {/* Fountain Tile Illustration */}
                {isFountain && (
                  <g transform={`translate(${x + 10}, ${y + 10})`}>
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="#0EA5E9"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                    <circle cx="18" cy="18" r="7" fill="#BAE6FD" />
                    <circle cx="18" cy="18" r="3" fill="#0369A1" />
                  </g>
                )}

                {/* Target Crystal Marker */}
                {isMarker && (
                  <g transform={`translate(${x + 15}, ${y + 11})`}>
                    <polygon
                      points="13,2 24,17 13,32 2,17"
                      fill={isSelected ? '#FFFFFF' : '#0EA5E9'}
                      stroke="#0369A1"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* Locked Indicator Dot */}
                {isLocked && (
                  <circle
                    cx={x + cellSize - 11}
                    cy={y + 11}
                    r="3.5"
                    fill="#FEF3C7"
                    stroke="#B45309"
                    strokeWidth="1.5"
                  />
                )}

                {/* Optional Unit Tile Counter Number */}
                {showCellNumbers && isSelected && selectedIndex > 0 && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 5}
                    textAnchor="middle"
                    fill={fillColors.text}
                    className="font-mono-num text-[14px] font-bold pointer-events-none"
                  >
                    {selectedIndex}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* Solid Rectangle Outline + Dimension Brackets */}
        {solidBox && (
          <g className="pointer-events-none">
            <rect
              x={solidBox.x + 1}
              y={solidBox.y + 1}
              width={solidBox.w - 2}
              height={solidBox.h - 2}
              rx="8"
              fill="none"
              stroke="#0F172A"
              strokeWidth="3"
              strokeOpacity="0.45"
            />
            {typeof highlightPerimeterProgress === 'number' && perimeterTotalPx > 0 && (
              <rect
                x={solidBox.x + 1}
                y={solidBox.y + 1}
                width={solidBox.w - 2}
                height={solidBox.h - 2}
                rx="8"
                fill="none"
                stroke="#EA580C"
                strokeWidth="5"
                strokeDasharray={perimeterTotalPx}
                strokeDashoffset={
                  perimeterTotalPx * (1 - Math.min(1, Math.max(0, highlightPerimeterProgress)))
                }
                strokeLinecap="round"
              />
            )}
            {showDimensions && (
              <>
                {/* Bottom width label */}
                <rect
                  x={solidBox.x + solidBox.w / 2 - 22}
                  y={solidBox.y + solidBox.h + 4}
                  width="44"
                  height="20"
                  rx="6"
                  fill="#0F172A"
                />
                <text
                  x={solidBox.x + solidBox.w / 2}
                  y={solidBox.y + solidBox.h + 18}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  className="font-mono-num text-[12px] font-bold"
                >
                  {analysis.width}
                </text>
                {/* Right height label */}
                <rect
                  x={solidBox.x + solidBox.w + 6}
                  y={solidBox.y + solidBox.h / 2 - 11}
                  width="30"
                  height="22"
                  rx="6"
                  fill="#0F172A"
                />
                <text
                  x={solidBox.x + solidBox.w + 21}
                  y={solidBox.y + solidBox.h / 2 + 4}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  className="font-mono-num text-[12px] font-bold"
                >
                  {analysis.height}
                </text>
              </>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
