interface Props {
  method: string;
  params: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ method, params, onConfirm, onCancel }: Props) {
  const killsDaemon = method === "stop";
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          <span className="danger-badge">⚠</span> Confirm <code>{method}</code>
        </h3>
        <p>
          This is a <strong>mutating</strong> method — it can move funds or change
          wallet/chain/daemon state.
          {killsDaemon && (
            <>
              {" "}
              <strong className="status-err">
                It will shut down the daemon; you will lose the node until it is restarted.
              </strong>
            </>
          )}
        </p>
        <pre className="modal-params">
          {method}({params})
        </pre>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Run anyway
          </button>
        </div>
      </div>
    </div>
  );
}
