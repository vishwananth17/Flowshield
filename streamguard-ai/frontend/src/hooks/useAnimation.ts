import { useState, useEffect, useRef } from 'react';

/**
 * High-precision exponential count-up hook for metrics.
 * Uses easeOutExpo for rapid acceleration and soft landing.
 */
export function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setValue(target);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo: 1 - 2^(-10 * progress)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setValue(Math.floor(startValue + (target - startValue) * eased));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return value;
}

/**
 * Format Indian Currency / Numerical Strings
 * e.g. 840000 -> ₹8.4L, 12000 -> ₹12k
 */
export function formatIndianMetric(num: number, isCurrency = true): string {
  const prefix = isCurrency ? '₹' : '';
  if (num >= 10_000_000) {
    return `${prefix}${(num / 10_000_000).toFixed(1)}Cr`;
  }
  if (num >= 100_000) {
    return `${prefix}${(num / 100_000).toFixed(1)}L`;
  }
  if (num >= 1_000) {
    return `${prefix}${(num / 1_000).toFixed(1)}k`;
  }
  return `${prefix}${num.toLocaleString('en-IN')}`;
}

/**
 * IntersectionObserver hook for viewport reveals
 */
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(element);
      }
    }, {
      threshold: 0.1,
      ...options
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}
