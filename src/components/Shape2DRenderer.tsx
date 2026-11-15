import React from 'react';
import type { Shape2DId, SolidShape3DDef } from '../game/types';

interface Shape2DFigureProps {
  type: Shape2DId;
  widthPx: number;
  heightPx: number;
  radiusPx?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  showGeometryGuides?: boolean;
}

function regularPolygonPoints(sides: number, rx: number, ry: number, startAngleDeg = -90): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const rad = ((startAngleDeg + (360 / sides) * i) * Math.PI) / 180;
    const x = Math.cos(rad) * rx;
    const y = Math.sin(rad) * ry;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

/**
 * Renders each 2D geometric shape centered around (0, 0).
 * Lingkaran is strictly rendered with SVG <circle cx={0} cy={0} r={r} /> — never polygon vertices.
 */
export const Shape2DFigure: React.FC<Shape2DFigureProps> = ({
  type,
  widthPx,
  heightPx,
  radiusPx,
  fill,
  stroke = '#0F172A',
  strokeWidth = 2.5,
  opacity = 0.92,
  showGeometryGuides = false,
}) => {
  const hw = widthPx / 2;
  const hh = heightPx / 2;

  if (type === 'lingkaran') {
    const r = radiusPx ?? Math.min(hw, hh);
    return (
      <g>
        <circle
          cx={0}
          cy={0}
          r={r}
          fill={fill}
          fillOpacity={opacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {showGeometryGuides && (
          <g pointerEvents="none">
            <line
              x1={0}
              y1={0}
              x2={r}
              y2={0}
              stroke="#0F172A"
              strokeWidth={1.8}
              strokeDasharray="4 3"
            />
            <circle cx={0} cy={0} r={3.2} fill="#0F172A" />
          </g>
        )}
      </g>
    );
  }

  if (type === 'persegi' || type === 'persegi_panjang') {
    return (
      <rect
        x={-hw}
        y={-hh}
        width={widthPx}
        height={heightPx}
        rx={2}
        fill={fill}
        fillOpacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (type === 'segitiga') {
    const points = `0,${-hh} ${hw},${hh} ${-hw},${hh}`;
    return (
      <polygon
        points={points}
        fill={fill}
        fillOpacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    );
  }

  if (type === 'trapesium') {
    const topHalf = hw * 0.58;
    const points = `${-topHalf},${-hh} ${topHalf},${-hh} ${hw},${hh} ${-hw},${hh}`;
    return (
      <polygon
        points={points}
        fill={fill}
        fillOpacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    );
  }

  if (type === 'jajar_genjang') {
    const skew = Math.min(hw * 0.42, 22);
    const points = `${-hw + skew},${-hh} ${hw},${-hh} ${hw - skew},${hh} ${-hw},${hh}`;
    return (
      <polygon
        points={points}
        fill={fill}
        fillOpacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    );
  }

  if (type === 'belah_ketupat') {
    const points = `0,${-hh} ${hw},0 0,${hh} ${-hw},0`;
    return (
      <polygon
        points={points}
        fill={fill}
        fillOpacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    );
  }

  if (type === 'segi_lima') {
    const points = regularPolygonPoints(5, hw, hh, -90);
    return (
      <polygon
        points={points}
        fill={fill}
        fillOpacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    );
  }

  // segi_enam
  const points = regularPolygonPoints(6, hw, hh, -90);
  return (
    <polygon
      points={points}
      fill={fill}
      fillOpacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
};

interface Shape2DThumbnailProps {
  type: Shape2DId;
  color: string;
  size?: number;
}

export const Shape2DThumbnail: React.FC<Shape2DThumbnailProps> = ({
  type,
  color,
  size = 44,
}) => {
  const isWide = type === 'persegi_panjang' || type === 'trapesium' || type === 'jajar_genjang';
  return (
    <svg width={size} height={size} viewBox="-32 -32 64 64" aria-hidden="true">
      <Shape2DFigure
        type={type}
        widthPx={isWide ? 48 : 40}
        heightPx={isWide ? 30 : 40}
        radiusPx={20}
        fill={color}
        strokeWidth={2.5}
        showGeometryGuides={type === 'lingkaran'}
      />
    </svg>
  );
};

interface SolidShape3DIllustrationProps {
  id: SolidShape3DDef['id'];
  color: string;
  size?: number;
}

export const SolidShape3DIllustration: React.FC<SolidShape3DIllustrationProps> = ({
  id,
  color,
  size = 110,
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      {id === 'kubus' && (
        <g stroke="#0F172A" strokeWidth="2.4" strokeLinejoin="round">
          <polygon points="30,42 60,24 90,42 60,60" fill={color} fillOpacity="0.55" />
          <polygon points="30,42 60,60 60,96 30,78" fill={color} fillOpacity="0.92" />
          <polygon points="60,60 90,42 90,78 60,96" fill={color} fillOpacity="0.72" />
        </g>
      )}

      {id === 'balok' && (
        <g stroke="#0F172A" strokeWidth="2.4" strokeLinejoin="round">
          <polygon points="18,46 66,24 102,42 54,64" fill={color} fillOpacity="0.52" />
          <polygon points="18,46 54,64 54,96 18,78" fill={color} fillOpacity="0.92" />
          <polygon points="54,64 102,42 102,74 54,96" fill={color} fillOpacity="0.72" />
        </g>
      )}

      {id === 'tabung' && (
        <g stroke="#0F172A" strokeWidth="2.4">
          <path
            d="M 30 36 L 30 84 A 30 12 0 0 0 90 84 L 90 36 Z"
            fill={color}
            fillOpacity="0.82"
          />
          <ellipse cx="60" cy="36" rx="30" ry="12" fill={color} fillOpacity="0.55" />
          <path
            d="M 30 84 A 30 12 0 0 1 90 84"
            fill="none"
            strokeDasharray="4 3"
            strokeOpacity="0.5"
          />
        </g>
      )}

      {id === 'kerucut' && (
        <g stroke="#0F172A" strokeWidth="2.4" strokeLinejoin="round">
          <path
            d="M 60 20 L 28 84 A 32 13 0 0 0 92 84 Z"
            fill={color}
            fillOpacity="0.86"
          />
          <ellipse
            cx="60"
            cy="84"
            rx="32"
            ry="13"
            fill={color}
            fillOpacity="0.45"
            strokeDasharray="4 3"
          />
        </g>
      )}

      {id === 'prisma_segitiga' && (
        <g stroke="#0F172A" strokeWidth="2.4" strokeLinejoin="round">
          <polygon points="24,86 48,36 70,86" fill={color} fillOpacity="0.92" />
          <polygon points="48,36 86,26 102,74 70,86" fill={color} fillOpacity="0.68" />
          <line x1="24" y1="86" x2="62" y2="74" strokeDasharray="4 3" strokeOpacity="0.45" />
          <line x1="62" y1="74" x2="86" y2="26" strokeDasharray="4 3" strokeOpacity="0.45" />
        </g>
      )}
    </svg>
  );
};
