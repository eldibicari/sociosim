"use client";

import { motion, useInView, useSpring, useMotionValue, useTransform } from "framer-motion";
import { useRef, useEffect, ReactNode } from "react";

// ─── Fade + slide up on scroll ────────────────────────────────────────────────
export function Reveal({
  children,
  delay = 0,
  y = 32,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger children ─────────────────────────────────────────────────────────
export function StaggerParent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
      className={className}
      style={{ width: "100%", display: "contents" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger child ────────────────────────────────────────────────────────────
export function StaggerChild({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number | string;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const isNumber = typeof value === "number";
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1800, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    if (inView && isNumber) {
      motionVal.set(value as number);
    }
  }, [inView, isNumber, motionVal, value]);

  if (!isNumber) {
    return (
      <span ref={ref}>
        {prefix}{value}{suffix}
      </span>
    );
  }

  return (
    <span ref={ref}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
