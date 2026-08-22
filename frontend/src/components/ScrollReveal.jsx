import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/motion';

export function ScrollReveal({ children, className = '', delay = 0, stagger = 0.06 }) {
  return (
    <motion.div
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({ children, className = '' }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}
