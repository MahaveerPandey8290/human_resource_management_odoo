const tones = {
  neutral: 'bg-sunken text-ink-secondary',
  primary: 'bg-primary-tint text-primary',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
  info: 'bg-info-tint text-info',
  accent: 'bg-accent-tint text-accent',
};

export default function Badge({ tone = 'neutral', children, className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-small font-medium ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
