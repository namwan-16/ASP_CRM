import { useEffect, useState } from "react";

export default function RequestState({ loading, error, onRetry }) {
  const [dismissed, setDismissed] = useState(null);
  useEffect(() => { setDismissed(null); }, [error, loading]);
  if (error && dismissed !== error) return <div className="crm-message crm-message--error crm-notification" role="alert"><span>{error}</span> {onRetry && <button type="button" onClick={() => { setDismissed(null); onRetry(); }}>Retry</button>}<button type="button" aria-label="Dismiss error" onClick={() => setDismissed(error)}>×</button></div>;
  if (loading) return <p className="crm-message" role="status">Loading records...</p>;
  return null;
}
