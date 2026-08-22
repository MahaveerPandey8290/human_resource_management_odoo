import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { easeOut } from '@/lib/motion';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-pressed shadow-sm',
  secondary: 'bg-white text-ink-primary border border-border-strong hover:bg-sunken hover:border-border-focus',
  ghost: 'text-ink-secondary hover:text-ink-primary hover:bg-sunken',
  danger: 'bg-danger text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
  accent: 'bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-sm',
};

const sizes = {
  sm: 'h-9 px-3 text-small gap-1.5',
  md: 'h-10 px-4 text-body gap-2',
  lg: 'h-12 px-6 text-body gap-2.5',
  icon: 'h-10 w-10 justify-center',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className = '', children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: easeOut }}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center font-medium rounded-input transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
});

export default Button;
