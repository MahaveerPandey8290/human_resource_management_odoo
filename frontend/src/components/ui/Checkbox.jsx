import { forwardRef, useId } from 'react';
import { Check } from 'lucide-react';

const Checkbox = forwardRef(function Checkbox(
  { label, checked, onChange, className = '', ...props },
  ref,
) {
  const id = useId();
  return (
    <label htmlFor={id} className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${className}`}>
      <span className="relative inline-flex">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <span className="w-5 h-5 rounded-[6px] border-2 border-border-strong bg-white transition-colors peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 flex items-center justify-center">
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </span>
      </span>
      {label && <span className="text-body text-ink-primary">{label}</span>}
    </label>
  );
});

export default Checkbox;
