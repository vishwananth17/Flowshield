import { useState, useEffect, useRef } from 'react';

/**
 * usePrefersReducedMotion: detects user's OS-level motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReduced;
}

/**
 * useScrollReveal: triggers enter animation when element passes IntersectionObserver threshold
 */
export function useScrollReveal(threshold: number = 0.1) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const current = ref.current;
    if (!current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold, prefersReducedMotion]);

  return { ref, isVisible };
}

/**
 * useCountUp: Tabular number count-up animation using cubic-bezier ease-out-expo
 * Duration strictly limited to 600ms
 */
export function useCountUp(target: number, duration: number = 600): number {
  const [count, setCount] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced || target <= 0) {
      setCount(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const easeOutExpo = (x: number): number => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    };

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      setCount(Math.round(easedProgress * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration, prefersReduced]);

  return count;
}
