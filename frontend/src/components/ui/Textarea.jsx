import { forwardRef, useId } from 'react';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', containerClassName = '', rows = 4, ...props },
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
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`w-full px-3.5 py-2.5 rounded-input bg-white border transition-colors text-body text-ink-primary placeholder:text-ink-muted focus-ring resize-none ${
          error ? 'border-danger' : 'border-border-strong focus:border-primary'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-small text-danger">{error}</p>
      ) : hint ? (
        <p className="text-small text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
