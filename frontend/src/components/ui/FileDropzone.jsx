import { useRef, useState } from 'react';
import { UploadCloud, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileDropzone({ label, accept = 'image/*,.pdf', onChange, required = false, error, hint, className = '' }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    setFile(f);
    onChange?.(f);
  };

  const reset = () => {
    setFile(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-label font-medium uppercase tracking-wide text-ink-secondary mb-1.5 block">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        className={`relative border-2 border-dashed rounded-input p-6 text-center cursor-pointer transition-colors ${
          dragging ? 'border-primary bg-primary-tint' : error ? 'border-danger' : 'border-border-strong hover:border-primary/50 hover:bg-sunken/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-body text-ink-primary font-medium">{file.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="text-ink-muted hover:text-danger transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <UploadCloud className="w-6 h-6 text-ink-muted" />
              <span className="text-body text-ink-secondary">Click or drag to upload</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="text-small text-danger mt-1.5">{error}</p>}
      {hint && !error && <p className="text-small text-ink-muted mt-1.5">{hint}</p>}
    </div>
  );
}
