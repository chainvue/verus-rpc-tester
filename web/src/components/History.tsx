import type { HistoryItem } from "../types";

interface Props {
  items: HistoryItem[];
  onReplay: (item: HistoryItem) => void;
  onClear: () => void;
}

export function History({ items, onReplay, onClear }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="history">
      <div className="history-head">
        <span>History</span>
        <button className="btn btn-sm" onClick={onClear}>
          clear
        </button>
      </div>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <button className="history-item" onClick={() => onReplay(it)} title={it.params}>
              <span className={`history-dot ${it.ok ? "ok" : "err"}`} />
              <span className="history-method">{it.method}</span>
              <span className="history-params">{it.params}</span>
              {it.ms !== undefined && <span className="history-ms">{it.ms}ms</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
