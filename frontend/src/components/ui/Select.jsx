import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className = '', containerClassName = '', ...props },
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
        <select
          ref={ref}
          id={id}
          className={`w-full h-10 pl-3.5 pr-10 rounded-input bg-white border transition-colors text-body text-ink-primary focus-ring appearance-none cursor-pointer ${
            error ? 'border-danger' : 'border-border-strong focus:border-primary'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            return <option key={val} value={val}>{label}</option>;
          })}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
    </div>
  );
});

export default Select;
