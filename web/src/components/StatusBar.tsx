import { useEffect, useState } from "react";
import { fetchStatus } from "../api";
import type { StatusResponse } from "../types";

export function StatusBar() {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const s = await fetchStatus();
        if (alive) setStatus(s);
      } catch {
        if (alive) setStatus({ connected: false, host: "", error: "unreachable" });
      }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const connected = status?.connected ?? false;

  return (
    <header className="statusbar">
      <div className="brand">
        <span className="brand-mark">⚡</span>
        <span className="brand-name">Verus RPC Tester</span>
      </div>
      <div className="status-info">
        <span className={`dot ${connected ? "dot-ok" : "dot-bad"}`} />
        {status ? (
          connected ? (
            <span className="status-text">
              <strong>{status.chain}</strong>
              <span className="sep">·</span>height {status.blocks?.toLocaleString()}
              <span className="sep">·</span>v{status.version}
              <span className="sep">·</span>
              <span className="muted">{status.host}</span>
            </span>
          ) : (
            <span className="status-text status-err">
              disconnected{status.host ? ` · ${status.host}` : ""}
              {status.error ? ` · ${status.error}` : ""}
            </span>
          )
        ) : (
          <span className="status-text muted">connecting…</span>
        )}
      </div>
    </header>
  );
}
