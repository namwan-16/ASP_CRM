export default function Notification({ message, error, onDismiss }) {
  if (!message && !error) return null;
  return (
    <div className={`crm-message crm-notification crm-message--${error ? "error" : "success"}`} role={error ? "alert" : "status"}>
      <span>{error || message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onDismiss}>×</button>
    </div>
  );
}
