import React from 'react'

/** Декоративная чёрная дыра для страницы «не найдено». */
export const BlackHoleIllustration: React.FC<{
  className?: string
}> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 240 240"
    width={240}
    height={240}
    aria-hidden
    role="img">
    <defs>
      <radialGradient
        id="bh-disk"
        cx="50%"
        cy="50%"
        r="50%">
        <stop
          offset="0%"
          stopColor="#f97316"
          stopOpacity="0.95"
        />
        <stop
          offset="35%"
          stopColor="#c026d3"
          stopOpacity="0.85"
        />
        <stop
          offset="70%"
          stopColor="#4f46e5"
          stopOpacity="0.4"
        />
        <stop
          offset="100%"
          stopColor="#020617"
          stopOpacity="0"
        />
      </radialGradient>
      <radialGradient
        id="bh-lens"
        cx="50%"
        cy="50%"
        r="50%">
        <stop
          offset="60%"
          stopColor="#38bdf8"
          stopOpacity="0"
        />
        <stop
          offset="85%"
          stopColor="#7dd3fc"
          stopOpacity="0.35"
        />
        <stop
          offset="100%"
          stopColor="#e0f2fe"
          stopOpacity="0.15"
        />
      </radialGradient>
      <filter id="bh-glow">
        <feGaussianBlur
          stdDeviation="2"
          result="b"
        />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="translate(120,120)">
      <ellipse
        rx="92"
        ry="36"
        fill="url(#bh-disk)"
        transform="rotate(-12)"
        opacity="0.9"
      />
      <ellipse
        rx="88"
        ry="32"
        fill="#020617"
        transform="rotate(-12)"
      />
      <circle r="38" fill="#000" />
      <circle
        r="52"
        fill="none"
        stroke="url(#bh-lens)"
        strokeWidth="3"
        opacity="0.85"
      />
      <circle
        r="44"
        fill="none"
        stroke="rgba(56,189,248,0.25)"
        strokeWidth="1.5"
        strokeDasharray="4 8"
      />
    </g>
  </svg>
)
