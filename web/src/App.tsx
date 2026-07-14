import { useEffect, useMemo, useState } from "react";
import { StatusBar } from "./components/StatusBar";
import { Sidebar } from "./components/Sidebar";
import { MethodPanel } from "./components/MethodPanel";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { History } from "./components/History";
import { callMethod, fetchHelp, fetchMethods } from "./api";
import type {
  CallResponse,
  HistoryItem,
  MethodCategory,
  MethodEntry,
} from "./types";

/** Validate a params string: must parse to a JSON array. Returns error message or null. */
function validateParams(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === "") return null; // treated as []
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    return `Invalid JSON: ${(e as Error).message}`;
  }
  if (!Array.isArray(parsed)) return "Params must be a JSON array, e.g. [\"arg1\", 2]";
  return null;
}

export function App() {
  const [categories, setCategories] = useState<MethodCategory[]>([]);
  const [rpcHost, setRpcHost] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<MethodEntry | null>(null);
  const [helpText, setHelpText] = useState("");
  const [helpLoading, setHelpLoading] = useState(false);

  const [params, setParams] = useState("[]");
  const [response, setResponse] = useState<CallResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const paramsError = useMemo(() => validateParams(params), [params]);

  const methodByName = useMemo(() => {
    const map = new Map<string, MethodEntry>();
    for (const c of categories) for (const m of c.methods) map.set(m.name, m);
    return map;
  }, [categories]);

  useEffect(() => {
    fetchMethods()
      .then((r) => {
        setCategories(r.categories);
        setRpcHost(r.host);
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  async function selectMethod(m: MethodEntry, presetParams?: string) {
    setSelected(m);
    setParams(presetParams ?? "[]");
    setResponse(null);
    setHelpText("");
    setHelpLoading(true);
    try {
      setHelpText(await fetchHelp(m.name));
    } catch {
      setHelpText(m.signature);
    } finally {
      setHelpLoading(false);
    }
  }

  function requestCall() {
    if (!selected || paramsError) return;
    if (selected.dangerous) {
      setConfirming(true);
      return;
    }
    void runCall();
  }

  async function runCall() {
    if (!selected) return;
    setConfirming(false);
    setLoading(true);
    setResponse(null);
    const parsedParams = params.trim() === "" ? [] : (JSON.parse(params) as unknown[]);
    try {
      const res = await callMethod(selected.name, parsedParams);
      setResponse(res);
      pushHistory(selected.name, params, res.ok, res.ok ? res.ms : undefined);
    } catch (e) {
      const res: CallResponse = {
        ok: false,
        error: { code: null, message: (e as Error).message },
      };
      setResponse(res);
      pushHistory(selected.name, params, false);
    } finally {
      setLoading(false);
    }
  }

  function pushHistory(method: string, p: string, ok: boolean, ms?: number) {
    setHistory((h) => {
      const id = (h[0]?.id ?? 0) + 1; // h[0] is newest → highest id
      const item: HistoryItem = {
        id,
        method,
        params: p,
        ok,
        ms,
        at: new Date().toLocaleTimeString(),
      };
      return [item, ...h].slice(0, 20);
    });
  }

  function replay(item: HistoryItem) {
    const m = methodByName.get(item.method);
    if (m) void selectMethod(m, item.params);
  }

  if (loadError) {
    return (
      <div className="app">
        <StatusBar />
        <div className="load-error">
          <h2>Could not load methods</h2>
          <p>{loadError}</p>
          <p className="muted">Is the daemon reachable and are the credentials in .env correct?</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <StatusBar />
      <div className="layout">
        <Sidebar
          categories={categories}
          selected={selected?.name ?? null}
          onSelect={(m) => void selectMethod(m)}
        />
        <main className="main">
          <MethodPanel
            method={selected}
            helpText={helpText}
            helpLoading={helpLoading}
            params={params}
            onParamsChange={setParams}
            paramsError={paramsError}
            onCall={requestCall}
            response={response}
            loading={loading}
            rpcHost={rpcHost}
          />
          <History
            items={history}
            onReplay={replay}
            onClear={() => setHistory([])}
          />
        </main>
      </div>
      {confirming && selected && (
        <ConfirmDialog
          method={selected.name}
          params={params}
          onConfirm={() => void runCall()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
