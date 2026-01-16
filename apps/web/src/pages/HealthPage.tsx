import { useEffect, useState } from 'react';

type ApiHealth = { ok: boolean; service: string };

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

export function HealthPage() {
  const [apiHealth, setApiHealth] = useState<ApiHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function run() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/health`, {
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const json: unknown = await res.json();
        setApiHealth(json as ApiHealth);
      } catch (err) {
        if (abortController.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    run();

    return () => abortController.abort();
  }, []);

  return (
    <section>
      <h1>Health</h1>
      <ul>
        <li>
          Web: <strong>ok</strong>
        </li>
        <li>
          API base URL: <code>{getApiBaseUrl()}</code>
        </li>
      </ul>

      <h2>API /health</h2>
      {error ? (
        <p style={{ color: 'crimson' }}>Error: {error}</p>
      ) : apiHealth ? (
        <pre>{JSON.stringify(apiHealth, null, 2)}</pre>
      ) : (
        <p>Loading…</p>
      )}
    </section>
  );
}
