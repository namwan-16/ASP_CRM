import { useEffect, useId, useRef } from "react";
import "./ConfirmDialog.css";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleCancel(event) {
    // Keep the parent state in control of opening and closing the dialog.
    event.preventDefault();
    if (!busy) onCancel?.();
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={handleCancel}
    >
      <div className="confirm-dialog__content">
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{message}</p>

        <div className="confirm-dialog__actions">
          <button
            className="confirm-dialog__button confirm-dialog__button--secondary"
            type="button"
            onClick={onCancel}
            disabled={busy}
            autoFocus
          >
            {cancelLabel}
          </button>

          <button
            className={`confirm-dialog__button confirm-dialog__button--${variant}`}
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
