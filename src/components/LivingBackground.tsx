import React from 'react';
import { ScreenView, type BuildingLocationId } from '../game/types';

interface LivingBackgroundProps {
  screen: ScreenView;
  buildingLocation?: BuildingLocationId;
  animationsEnabled: boolean;
}

export const LivingBackground: React.FC<LivingBackgroundProps> = ({
  screen,
  buildingLocation = 'geometry-village',
  animationsEnabled,
}) => {
  const isNightZone =
    screen === ScreenView.BUILDING && buildingLocation === 'castle-island';

  // Subtle camera parallax offset based on active world
  const parallaxShift =
    screen === ScreenView.HOME
      ? '0px'
      : screen === ScreenView.MAP
      ? '-10px'
      : screen === ScreenView.BUILDING
      ? '-24px'
      : '-16px';

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden transition-colors duration-700 ${
        animationsEnabled ? '' : 'reduced-motion'
      } ${
        isNightZone
          ? 'bg-gradient-to-b from-indigo-950/90 via-slate-900/75 to-teal-950/70'
          : 'bg-gradient-to-b from-sky-100/80 via-cyan-50/60 to-emerald-50/75'
      }`}
      aria-hidden="true"
      data-testid="living-background"
      data-animations-enabled={animationsEnabled ? 'true' : 'false'}
    >
      {/* Sky Layer: Sun / Stars + Clouds + Birds */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translateX(${parallaxShift})`, transition: 'transform 600ms ease-out' }}
      >
        {isNightZone ? (
          /* Twinkling Stars & Crescent Moon in Castle Island */
          <g>
            <circle cx="1220" cy="115" r="42" fill="#FEF08A" opacity="0.9" />
            <circle cx="1238" cy="108" r="36" fill="#1E1B4B" />
            {[
              { x: 160, y: 90, delay: '0s' },
              { x: 340, y: 140, delay: '0.7s' },
              { x: 580, y: 75, delay: '1.2s' },
              { x: 780, y: 120, delay: '0.4s' },
              { x: 980, y: 65, delay: '1.6s' },
              { x: 1340, y: 190, delay: '0.9s' },
            ].map((s, idx) => (
              <circle
                key={idx}
                cx={s.x}
                cy={s.y}
                r="3.2"
                fill="#FEF9C3"
                className="bg-star-twinkle"
                style={{ animationDelay: s.delay }}
              />
            ))}
          </g>
        ) : (
          /* Daytime Glowing Sun */
          <g className="bg-sun-pulse">
            <circle cx="1290" cy="110" r="64" fill="#FDE68A" opacity="0.35" />
            <circle cx="1290" cy="110" r="42" fill="#FCD34D" opacity="0.65" />
            <circle cx="1290" cy="110" r="28" fill="#FBBF24" />
          </g>
        )}

        {/* Drifting Clouds */}
        <g className="bg-cloud-slow" opacity={isNightZone ? 0.25 : 0.72}>
          <g transform="translate(130, 85)">
            <ellipse cx="45" cy="30" rx="45" ry="20" fill="#FFFFFF" />
            <ellipse cx="80" cy="22" rx="34" ry="22" fill="#FFFFFF" />
            <ellipse cx="110" cy="32" rx="32" ry="18" fill="#FFFFFF" />
          </g>
          <g transform="translate(860, 130)">
            <ellipse cx="50" cy="28" rx="48" ry="18" fill="#FFFFFF" />
            <ellipse cx="88" cy="20" rx="32" ry="20" fill="#FFFFFF" />
          </g>
        </g>

        <g className="bg-cloud-alt" opacity={isNightZone ? 0.2 : 0.58}>
          <g transform="translate(500, 62)">
            <ellipse cx="40" cy="24" rx="40" ry="16" fill="#FFFFFF" />
            <ellipse cx="70" cy="18" rx="28" ry="18" fill="#FFFFFF" />
          </g>
        </g>

        {/* Flying Birds */}
        {!isNightZone && (
          <g className="bg-bird-glide" stroke="#334155" strokeWidth="2.2" fill="none" strokeLinecap="round">
            <path d="M 40 160 Q 48 152 56 160 Q 64 152 72 160" />
            <path d="M 85 182 Q 91 175 97 182 Q 103 175 109 182" />
          </g>
        )}

        {/* Slow Hot Air Balloon */}
        <g className="bg-balloon-float" transform="translate(1130, 250)" opacity={0.75}>
          <ellipse cx="0" cy="0" rx="22" ry="28" fill="#FB7185" />
          <path d="M -8 -26 Q 0 -30 8 -26 L 6 24 L -6 24 Z" fill="#FBBF24" />
          <line x1="-10" y1="26" x2="-6" y2="38" stroke="#64748B" strokeWidth="1.5" />
          <line x1="10" y1="26" x2="6" y2="38" stroke="#64748B" strokeWidth="1.5" />
          <rect x="-8" y="38" width="16" height="11" rx="2" fill="#92400E" />
        </g>

        {/* Distant Hills + Animated Building Window Lights */}
        <path
          d="M 0 760 Q 260 680 540 745 T 1060 735 T 1440 755 L 1440 900 L 0 900 Z"
          fill={isNightZone ? '#1E293B' : '#A7F3D0'}
          opacity="0.7"
        />
        <path
          d="M 0 805 Q 340 750 720 795 T 1440 785 L 1440 900 L 0 900 Z"
          fill={isNightZone ? '#0F172A' : '#6EE7B7'}
          opacity="0.75"
        />

        {/* Animated Water Waves along the lower horizon */}
        <g opacity="0.65">
          <rect x="0" y="838" width="1440" height="62" fill={isNightZone ? '#0C4A6E' : '#38BDF8'} opacity="0.45" />
          <path
            className="bg-water-wave"
            d="M 0 852 Q 60 842 120 852 T 240 852 T 360 852 T 480 852 T 600 852 T 720 852 T 840 852 T 960 852 T 1080 852 T 1200 852 T 1320 852 T 1440 852 T 1560 852"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            opacity="0.7"
          />
        </g>

        {/* Background Village Silhouette: Swaying Trees, Flag & Blinking Lights */}
        <g transform="translate(80, 725)">
          <rect x="26" y="45" width="10" height="36" rx="3" fill="#78350F" />
          <g className="bg-tree-sway">
            <circle cx="31" cy="36" r="24" fill={isNightZone ? '#065F46' : '#10B981'} />
            <circle cx="16" cy="46" r="16" fill={isNightZone ? '#047857' : '#34D399'} />
            <circle cx="46" cy="46" r="16" fill={isNightZone ? '#047857' : '#34D399'} />
          </g>
        </g>

        <g transform="translate(1310, 710)">
          <rect x="0" y="25" width="46" height="58" rx="4" fill={isNightZone ? '#334155' : '#FDE68A'} />
          <polygon points="-6,25 23,2 52,25" fill="#EA580C" />
          <rect x="10" y="38" width="10" height="10" rx="2" fill="#FBBF24" className="bg-window-blink" />
          <rect x="26" y="38" width="10" height="10" rx="2" fill="#FBBF24" className="bg-window-blink" />
          {/* Waving Flag */}
          <line x1="23" y1="-16" x2="23" y2="2" stroke="#475569" strokeWidth="2.5" />
          <polygon points="23,-16 42,-10 23,-4" fill="#0D9488" className="bg-flag-wave" />
        </g>

        {/* Tiny Roaming Villager Sprite */}
        <g className="bg-walker-patrol" transform="translate(220, 772)">
          <circle cx="0" cy="-12" r="5" fill="#FDBA74" />
          <rect x="-5" y="-6" width="10" height="12" rx="3" fill="#0284C7" />
        </g>
      </svg>
    </div>
  );
};
