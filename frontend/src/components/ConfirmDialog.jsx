import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 items-start">
        <div className={`w-10 h-10 rounded-card flex items-center justify-center shrink-0 ${danger ? 'bg-danger-tint' : 'bg-warning-tint'}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-danger' : 'text-warning'}`} />
        </div>
        <p className="text-body text-ink-secondary pt-1.5">{message}</p>
      </div>
    </Modal>
  );
}
