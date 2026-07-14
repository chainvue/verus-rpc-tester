import { useState } from "react";
import type { CallResponse } from "../types";

interface Props {
  response: CallResponse | null;
  loading: boolean;
  // For "copy as curl".
  method: string;
  params: string;
  rpcHost: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "copied ✓" : label}
    </button>
  );
}

export function ResultView({ response, loading, method, params, rpcHost }: Props) {
  if (loading) {
    return <div className="result result-loading">Calling…</div>;
  }
  if (!response) {
    return <div className="result result-empty">Run a method to see the response.</div>;
  }

  // Note: password intentionally left as a shell placeholder — never the real value.
  const curl = [
    `curl -s --user "$RPC_USER:$RPC_PASS" \\`,
    `  --data-binary '${JSON.stringify({ jsonrpc: "1.0", id: "test", method, params: safeParse(params) })}' \\`,
    `  -H 'content-type: text/plain;' http://${rpcHost}/`,
  ].join("\n");

  return (
    <div className="result">
      <div className="result-head">
        {response.ok ? (
          <span className="result-status ok">✓ ok · {response.ms} ms</span>
        ) : (
          <span className="result-status err">
            ✕ error{response.error.code !== null ? ` · code ${response.error.code}` : ""}
          </span>
        )}
        <div className="result-actions">
          {response.ok && <CopyButton text={response.resultText} label="copy JSON" />}
          <CopyButton text={curl} label="copy as curl" />
        </div>
      </div>
      {response.ok ? (
        <pre className="result-body">{response.resultText}</pre>
      ) : (
        <pre className="result-body result-error">{response.error.message}</pre>
      )}
    </div>
  );
}

function safeParse(params: string): unknown {
  try {
    return JSON.parse(params);
  } catch {
    return [];
  }
}
