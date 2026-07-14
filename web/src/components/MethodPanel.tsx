import type { CallResponse, MethodEntry } from "../types";
import { ResultView } from "./ResultView";

interface Props {
  method: MethodEntry | null;
  helpText: string;
  helpLoading: boolean;
  params: string;
  onParamsChange: (v: string) => void;
  paramsError: string | null;
  onCall: () => void;
  response: CallResponse | null;
  loading: boolean;
  rpcHost: string;
}

export function MethodPanel({
  method,
  helpText,
  helpLoading,
  params,
  onParamsChange,
  paramsError,
  onCall,
  response,
  loading,
  rpcHost,
}: Props) {
  if (!method) {
    return (
      <section className="panel panel-empty">
        <div>
          <h2>Pick a method</h2>
          <p className="muted">
            Choose any RPC method from the left to see its usage and call it against the node.
          </p>
        </div>
      </section>
    );
  }

  const canCall = !loading && paramsError === null;

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>
          <code>{method.name}</code>
          {method.dangerous && (
            <span className="danger-badge danger-inline" title="Mutating / destructive">
              ⚠ mutating
            </span>
          )}
        </h2>
      </div>

      <div className="help-box">
        {helpLoading ? (
          <span className="muted">loading help…</span>
        ) : (
          <pre>{helpText || method.signature}</pre>
        )}
      </div>

      <div className="params-editor">
        <label>
          Params <span className="muted">(JSON array of positional arguments)</span>
        </label>
        <textarea
          className={`params-input ${paramsError ? "invalid" : ""}`}
          spellCheck={false}
          value={params}
          onChange={(e) => onParamsChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canCall) onCall();
          }}
          rows={4}
        />
        <div className="params-footer">
          <span className={`params-status ${paramsError ? "err" : "ok"}`}>
            {paramsError ?? "valid JSON array"}
          </span>
          <button className="btn btn-primary" disabled={!canCall} onClick={onCall}>
            {loading ? "Calling…" : "Call ⌘⏎"}
          </button>
        </div>
      </div>

      <ResultView
        response={response}
        loading={loading}
        method={method.name}
        params={params}
        rpcHost={rpcHost}
      />
    </section>
  );
}
