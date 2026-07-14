export interface MethodEntry {
  name: string;
  signature: string;
  dangerous: boolean;
}

export interface MethodCategory {
  category: string;
  methods: MethodEntry[];
}

export interface MethodsResponse {
  host: string;
  categories: MethodCategory[];
}

export interface StatusResponse {
  connected: boolean;
  host: string;
  chain?: string;
  blocks?: number;
  version?: string;
  error?: string;
}

export interface CallError {
  code: number | null;
  message: string;
}

export type CallResponse =
  | { ok: true; resultText: string; ms: number }
  | { ok: false; error: CallError };

export interface HistoryItem {
  id: number;
  method: string;
  params: string;
  ok: boolean;
  ms?: number;
  at: string;
}
