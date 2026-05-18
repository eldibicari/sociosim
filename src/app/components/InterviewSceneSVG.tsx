"use client";

// Pure SVG + CSS animation — no WebGL, no Three.js, works on any GPU
export function InterviewSceneSVG() {
  return (
    <svg
      viewBox="0 0 800 340"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.45,
      }}
    >
      <defs>
        {/* Glow filters */}
        <filter id="glow-indigo" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-beam" x="-20%" y="-100%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stroke dash for drawing animation */}
        <style>{`
          @keyframes drawFigure {
            0%   { stroke-dashoffset: 600; opacity: 0.4; }
            50%  { stroke-dashoffset: 0;   opacity: 0.9; }
            100% { stroke-dashoffset: -600; opacity: 0.4; }
          }
          @keyframes drawFigure2 {
            0%   { stroke-dashoffset: -600; opacity: 0.4; }
            50%  { stroke-dashoffset: 0;    opacity: 0.9; }
            100% { stroke-dashoffset: 600;  opacity: 0.4; }
          }
          @keyframes sway1 {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            33%      { transform: translateX(4px) rotate(1deg); }
            66%      { transform: translateX(-3px) rotate(-0.5deg); }
          }
          @keyframes sway2 {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            33%      { transform: translateX(-4px) rotate(-1deg); }
            66%      { transform: translateX(3px) rotate(0.5deg); }
          }
          @keyframes beamPulse {
            0%, 100% { opacity: 0.12; stroke-width: 1; }
            50%      { opacity: 0.35; stroke-width: 1.5; }
          }
          @keyframes particleDrift {
            0%, 100% { transform: translateY(0); opacity: 0.3; }
            50%      { transform: translateY(-8px); opacity: 0.7; }
          }
          .figure-left  { animation: sway1 6s ease-in-out infinite; transform-origin: 210px 220px; }
          .figure-right { animation: sway2 7s ease-in-out infinite; transform-origin: 590px 220px; }
          .stroke-left  {
            stroke-dasharray: 600;
            animation: drawFigure 8s ease-in-out infinite;
          }
          .stroke-right {
            stroke-dasharray: 600;
            animation: drawFigure2 8s ease-in-out infinite;
          }
          .beam { animation: beamPulse 3s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* ── Left figure (indigo) ── */}
      <g className="figure-left" filter="url(#glow-indigo)">
        {/* Head hexagon */}
        <polygon
          className="stroke-left"
          points="210,120 225,111 240,120 240,138 225,147 210,138"
          fill="none"
          stroke="#818cf8"
          strokeWidth="1.5"
        />
        {/* Torso */}
        <line className="stroke-left" x1="225" y1="147" x2="225" y2="210" stroke="#818cf8" strokeWidth="1.5" fill="none" />
        {/* Shoulders */}
        <line className="stroke-left" x1="190" y1="165" x2="260" y2="165" stroke="#818cf8" strokeWidth="1.5" fill="none" />
        {/* Arms */}
        <line className="stroke-left" x1="190" y1="165" x2="175" y2="200" stroke="#818cf8" strokeWidth="1.5" fill="none" />
        <line className="stroke-left" x1="260" y1="165" x2="272" y2="200" stroke="#818cf8" strokeWidth="1.5" fill="none" />
        {/* Legs */}
        <line className="stroke-left" x1="225" y1="210" x2="208" y2="260" stroke="#818cf8" strokeWidth="1.5" fill="none" />
        <line className="stroke-left" x1="225" y1="210" x2="242" y2="260" stroke="#818cf8" strokeWidth="1.5" fill="none" />
        {/* Detail lines on torso */}
        <line className="stroke-left" x1="205" y1="180" x2="245" y2="180" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
        <line className="stroke-left" x1="208" y1="195" x2="242" y2="195" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
      </g>

      {/* ── Right figure (green) ── */}
      <g className="figure-right" filter="url(#glow-green)">
        {/* Head hexagon */}
        <polygon
          className="stroke-right"
          points="575,120 590,111 605,120 605,138 590,147 575,138"
          fill="none"
          stroke="#34d399"
          strokeWidth="1.5"
        />
        {/* Torso */}
        <line className="stroke-right" x1="590" y1="147" x2="590" y2="210" stroke="#34d399" strokeWidth="1.5" fill="none" />
        {/* Shoulders */}
        <line className="stroke-right" x1="555" y1="165" x2="625" y2="165" stroke="#34d399" strokeWidth="1.5" fill="none" />
        {/* Arms */}
        <line className="stroke-right" x1="555" y1="165" x2="543" y2="200" stroke="#34d399" strokeWidth="1.5" fill="none" />
        <line className="stroke-right" x1="625" y1="165" x2="640" y2="200" stroke="#34d399" strokeWidth="1.5" fill="none" />
        {/* Legs */}
        <line className="stroke-right" x1="590" y1="210" x2="573" y2="260" stroke="#34d399" strokeWidth="1.5" fill="none" />
        <line className="stroke-right" x1="590" y1="210" x2="607" y2="260" stroke="#34d399" strokeWidth="1.5" fill="none" />
        {/* Detail lines */}
        <line className="stroke-right" x1="570" y1="180" x2="610" y2="180" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
        <line className="stroke-right" x1="573" y1="195" x2="607" y2="195" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
      </g>

      {/* ── Connection beam ── */}
      <line
        className="beam"
        x1="272" y1="190" x2="543" y2="190"
        stroke="#6366f1"
        strokeWidth="1"
        filter="url(#glow-beam)"
      />
      {/* Beam dots */}
      {[320, 370, 400, 430, 480].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy={190}
          r={2}
          fill="#6366f1"
          style={{
            animation: `particleDrift ${2 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* ── Floating particles ── */}
      {[
        { x: 80,  y: 100, c: "#818cf8", d: "2.1s", delay: "0s" },
        { x: 130, y: 250, c: "#818cf8", d: "3.2s", delay: "0.5s" },
        { x: 160, y: 170, c: "#a78bfa", d: "2.8s", delay: "1s" },
        { x: 680, y: 120, c: "#34d399", d: "2.4s", delay: "0.3s" },
        { x: 720, y: 230, c: "#34d399", d: "3.1s", delay: "0.8s" },
        { x: 650, y: 280, c: "#6ee7b7", d: "2.6s", delay: "1.2s" },
        { x: 400, y:  60, c: "#6366f1", d: "3.5s", delay: "0.6s" },
        { x: 360, y: 290, c: "#8b5cf6", d: "2.9s", delay: "0.2s" },
      ].map(({ x, y, c, d, delay }, i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={2.5}
          fill={c}
          style={{
            animation: `particleDrift ${d} ease-in-out infinite`,
            animationDelay: delay,
            opacity: 0.5,
          }}
        />
      ))}
    </svg>
  );
}
