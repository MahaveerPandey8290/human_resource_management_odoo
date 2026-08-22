import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className = '', containerClassName = '', ...props },
  ref,
) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-label font-medium uppercase tracking-wide text-ink-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />}
        <input
          ref={ref}
          id={id}
          className={`w-full h-10 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 rounded-input bg-white border transition-colors text-body text-ink-primary placeholder:text-ink-muted focus-ring ${
            error ? 'border-danger focus:border-danger' : 'border-border-strong focus:border-primary'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-small text-danger flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="text-small text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
