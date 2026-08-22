import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

const DatePicker = forwardRef(function DatePicker(
  { label, error, min, max, className = '', containerClassName = '', ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-label font-medium uppercase tracking-wide text-ink-secondary">{label}</label>
      )}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
        <input
          ref={ref}
          type="date"
          min={min}
          max={max}
          className={`w-full h-10 pl-10 pr-3.5 rounded-input bg-white border transition-colors text-body text-ink-primary focus-ring ${
            error ? 'border-danger' : 'border-border-strong focus:border-primary'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
    </div>
  );
});

export default DatePicker;
