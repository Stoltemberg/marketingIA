'use client';

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

interface AnimeStaggerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerAmount?: number;
  duration?: number;
  easing?: string;
}

export function AnimeStagger({
  children,
  className = '',
  delay = 0,
  staggerAmount = 100,
  duration = 1000,
  easing = 'spring(1, 80, 10, 0)',
}: AnimeStaggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set initial state to avoid flicker
    const targets = containerRef.current.children;
    anime.set(targets, {
      opacity: 0,
      translateY: 20,
    });

    // Stagger animation
    anime({
      targets: targets,
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(staggerAmount, { start: delay }),
      duration: duration,
      easing: easing,
    });
  }, [delay, staggerAmount, duration, easing]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
