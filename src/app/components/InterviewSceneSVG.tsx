"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function InterviewSceneSVG() {
  // Mouse-tracking for subtle interactive tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth spring physics for fluid motion
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  // Map mouse position to rotation values
  const rotateY = useTransform(springX, [0, 1], [-12, 12]);
  const rotateX = useTransform(springY, [0, 1], [6, -6]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width);
    mouseY.set((event.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        perspective: 1200,
      }}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateZ: [0, 1.5, 0, -1.5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          viewBox="0 0 520 400"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        >
      <defs>
        {/* Gradients */}
        <radialGradient id="grad-left" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#8B7CF8" />
          <stop offset="100%" stopColor="#6D5DF6" />
        </radialGradient>
        <radialGradient id="grad-right" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C6AF5" />
        </radialGradient>
        <radialGradient id="orb-bg-1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6D5DF6" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#6D5DF6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb-bg-2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EFEDFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#EFEDFF" stopOpacity="0" />
        </radialGradient>
        {/* Glow filter */}
        <filter id="glow-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-strong" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="blur-heavy" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>

      {/* ── Background atmosphere orbs ── */}
      <ellipse cx="130" cy="210" rx="140" ry="130" fill="url(#orb-bg-1)" filter="url(#blur-heavy)">
        <animate attributeName="rx" values="140;155;140" dur="9s" repeatCount="indefinite" />
        <animate attributeName="ry" values="130;145;130" dur="9s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="390" cy="200" rx="130" ry="120" fill="url(#orb-bg-1)" filter="url(#blur-heavy)">
        <animate attributeName="rx" values="130;145;130" dur="11s" repeatCount="indefinite" />
        <animate attributeName="ry" values="120;135;120" dur="11s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="260" cy="180" rx="100" ry="80" fill="url(#orb-bg-2)" filter="url(#blur-heavy)" />

      {/* ── Left figure (student / interviewer) ── */}
      <g filter="url(#glow-soft)">
        {/* floating group */}
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="6s" repeatCount="indefinite" additive="sum" />
          {/* Body / torso shape */}
          <ellipse cx="130" cy="295" rx="52" ry="38" fill="url(#grad-left)" opacity="0.82" />
          {/* Shoulders curve */}
          <path d="M 80 275 Q 130 255 180 275" stroke="url(#grad-left)" strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.7" />
          {/* Head */}
          <circle cx="130" cy="218" r="38" fill="url(#grad-left)" opacity="0.92" />
          {/* Face highlight */}
          <circle cx="120" cy="210" r="10" fill="white" opacity="0.18" />
        </g>
      </g>

      {/* ── Right figure (persona) ── */}
      <g filter="url(#glow-soft)">
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="7.5s" repeatCount="indefinite" additive="sum" />
          {/* Body */}
          <ellipse cx="390" cy="295" rx="52" ry="38" fill="url(#grad-right)" opacity="0.78" />
          {/* Shoulders */}
          <path d="M 340 275 Q 390 255 440 275" stroke="url(#grad-right)" strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.65" />
          {/* Head */}
          <circle cx="390" cy="218" r="38" fill="url(#grad-right)" opacity="0.88" />
          {/* Face highlight */}
          <circle cx="380" cy="210" r="10" fill="white" opacity="0.15" />
        </g>
      </g>

      {/* ── Conversation flow between the two ── */}
      {/* Animated dashed arc */}
      <path
        d="M 178 230 Q 260 170 342 230"
        stroke="rgba(109,93,246,0.35)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="6 5"
        strokeLinecap="round"
      >
        <animate attributeName="stroke-dashoffset" values="0;-44" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0.55;0.35" dur="4s" repeatCount="indefinite" />
      </path>

      {/* Floating dots along the arc */}
      <circle cx="214" cy="204" r="4.5" fill="#6D5DF6" opacity="0.5" filter="url(#glow-soft)">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.4s" begin="0s" repeatCount="indefinite" />
        <animate attributeName="r" values="4.5;5.5;4.5" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="260" cy="186" r="5" fill="#8B7CF8" opacity="0.6" filter="url(#glow-soft)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
        <animate attributeName="r" values="5;6.5;5" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="306" cy="204" r="4.5" fill="#6D5DF6" opacity="0.5" filter="url(#glow-soft)">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.4s" begin="1.6s" repeatCount="indefinite" />
        <animate attributeName="r" values="4.5;5.5;4.5" dur="2.4s" begin="1.6s" repeatCount="indefinite" />
      </circle>

      {/* ── Speech bubble left ── */}
      <g opacity="0.88" filter="url(#glow-soft)">
        <animate attributeName="opacity" values="0.88;1;0.88" dur="5s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="5s" repeatCount="indefinite" additive="sum" />
        <rect x="56" y="140" width="68" height="34" rx="12" fill="white" fillOpacity="0.92" />
        <polygon points="80,174 94,174 82,185" fill="white" fillOpacity="0.92" />
        {/* Dots inside bubble */}
        <circle cx="76" cy="157" r="3.5" fill="#6D5DF6" opacity="0.7" />
        <circle cx="90" cy="157" r="3.5" fill="#6D5DF6" opacity="0.7" />
        <circle cx="104" cy="157" r="3.5" fill="#6D5DF6" opacity="0.7" />
      </g>

      {/* ── Speech bubble right ── */}
      <g opacity="0.82" filter="url(#glow-soft)">
        <animate attributeName="opacity" values="0.82;1;0.82" dur="5s" begin="2.5s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="5s" begin="2.5s" repeatCount="indefinite" additive="sum" />
        <rect x="390" y="134" width="80" height="36" rx="12" fill="white" fillOpacity="0.88" />
        <polygon points="430,170 444,170 436,182" fill="white" fillOpacity="0.88" />
        {/* Lines inside bubble (text lines) */}
        <line x1="404" y1="148" x2="456" y2="148" stroke="#6D5DF6" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        <line x1="404" y1="156" x2="444" y2="156" stroke="#6D5DF6" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      </g>

      {/* ── Small decorative floating particles ── */}
      <circle cx="60" cy="100" r="3" fill="#EFEDFF" opacity="0.6">
        <animate attributeName="cy" values="100;88;100" dur="8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="460" cy="90" r="2.5" fill="#A78BFA" opacity="0.5">
        <animate attributeName="cy" values="90;78;90" dur="10s" repeatCount="indefinite" />
      </circle>
      <circle cx="260" cy="340" r="3.5" fill="#6D5DF6" opacity="0.3">
        <animate attributeName="cy" values="340;328;340" dur="7s" repeatCount="indefinite" />
      </circle>
      <circle cx="48" cy="310" r="2" fill="#8B7CF8" opacity="0.4">
        <animate attributeName="cy" values="310;300;310" dur="9s" repeatCount="indefinite" />
      </circle>
      <circle cx="472" cy="330" r="2.5" fill="#7C6AF5" opacity="0.4">
        <animate attributeName="cy" values="330;320;330" dur="6s" repeatCount="indefinite" />
      </circle>
        </svg>
      </motion.div>
    </motion.div>
  );
}
