import { useCallback, useEffect, useState } from "react";
import { errorMessage, listAll } from "../api/crm";


export default function useRecords(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listAll(path, { signal: controller.signal }).then((rows) => {
      if (!controller.signal.aborted) setData(rows);
    }).catch((requestError) => {
      if (!controller.signal.aborted) setError(errorMessage(requestError));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [path, version]);
  return { data, loading, error, refresh };
}
