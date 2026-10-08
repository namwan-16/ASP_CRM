export default function RequestState({ loading, error, onRetry }) {
  if (error) return <div className="crm-message crm-message--error" role="alert">{error} {onRetry && <button type="button" onClick={onRetry}>Retry</button>}</div>;
  if (loading) return <p className="crm-message" role="status">Loading records...</p>;
  return null;
}
