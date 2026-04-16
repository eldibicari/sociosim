"use client";

import { motion, useInView, useSpring, useMotionValue, useTransform } from "framer-motion";
import { useRef, useEffect, ReactNode, CSSProperties } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Fade + slide up on scroll ────────────────────────────────────────────────
export function Reveal({
  children,
  delay = 0,
  y = 28,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger item — use index prop for delay offset ───────────────────────────
export function FadeIn({
  children,
  index = 0,
  baseDelay = 0,
  style,
  className,
}: {
  children: ReactNode;
  index?: number;
  baseDelay?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: baseDelay + index * 0.12, ease: EASE }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
export function AnimatedCounter({
  value,
}: {
  value: number | string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const isNumber = typeof value === "number";
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1800, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    if (inView && isNumber) motionVal.set(value as number);
  }, [inView, isNumber, motionVal, value]);

  if (!isNumber) return <span ref={ref}>{value}</span>;

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>
    </span>
  );
}
