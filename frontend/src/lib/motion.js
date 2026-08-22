// Shared Framer Motion variants. All respect prefers-reduced-motion via useReducedMotion at call sites.

import { useReducedMotion } from 'framer-motion';

export const easeOut = [0.22, 1, 0.36, 1];
export const spring = { type: 'spring', stiffness: 380, damping: 30 };
export const springGentle = { type: 'spring', stiffness: 260, damping: 28 };

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: easeOut } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: spring },
};

export const routeTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const staggerContainer = (stagger = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const cardHover = {
  rest: { y: 0, boxShadow: '0 1px 2px rgba(16,24,40,.05)' },
  hover: { y: -2, boxShadow: '0 8px 24px -8px rgba(16,24,40,.16)', transition: { duration: 0.2, ease: easeOut } },
};

export const toastSpring = {
  initial: { opacity: 0, y: 40, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

export const pillTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 32,
};

export function useMotion() {
  const shouldReduce = useReducedMotion();
  return {
    reduce: shouldReduce,
    fadeUp: shouldReduce ? fadeIn : fadeUp,
    route: shouldReduce ? fadeIn : routeTransition,
    scale: shouldReduce ? fadeIn : scaleIn,
    stagger: shouldReduce ? staggerContainer(0, 0) : staggerContainer(),
  };
}
