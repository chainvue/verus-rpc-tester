import { client } from "./verus.js";
import { isDangerous } from "./dangerous.js";

export interface MethodEntry {
  name: string;
  /** The one-line usage string from `help`, e.g. `getblock "hash|height" ( verbosity )`. */
  signature: string;
  dangerous: boolean;
}

export interface MethodCategory {
  category: string;
  methods: MethodEntry[];
}

interface ParsedHelp {
  categories: MethodCategory[];
  /** Flat set of every method name, for validating incoming requests. */
  names: Set<string>;
}

const CATEGORY_RE = /^==\s*(.+?)\s*==$/;
// A line starts a new method when it begins (column 0) with a lowercase RPC identifier.
// Wrapped continuation lines start with whitespace, a quote, or a brace instead.
const METHOD_LINE_RE = /^([a-z][a-z0-9_]*)(?:\s(.*))?$/;

/**
 * Parse verusd's `help` output. It looks like:
 *
 *   == Blockchain ==
 *   getblockcount
 *   getblock "hash|height" ( verbosity )
 *   ...
 *
 * Some usage strings wrap across lines; those continuations are appended to the
 * previous method's signature.
 */
export function parseHelp(raw: string): ParsedHelp {
  const categories: MethodCategory[] = [];
  const names = new Set<string>();
  let current: MethodCategory | null = null;
  let lastMethod: MethodEntry | null = null;

  for (const line of raw.split("\n")) {
    const trimmedRight = line.replace(/\s+$/, "");
    if (trimmedRight === "") continue;

    const catMatch = CATEGORY_RE.exec(trimmedRight.trim());
    if (catMatch) {
      current = { category: catMatch[1], methods: [] };
      categories.push(current);
      lastMethod = null;
      continue;
    }

    const methodMatch = METHOD_LINE_RE.exec(trimmedRight);
    if (methodMatch && !names.has(methodMatch[1])) {
      const name = methodMatch[1];
      const entry: MethodEntry = {
        name,
        signature: trimmedRight,
        dangerous: isDangerous(name),
      };
      names.add(name);
      lastMethod = entry;
      if (!current) {
        current = { category: "Other", methods: [] };
        categories.push(current);
      }
      current.methods.push(entry);
    } else if (lastMethod) {
      // Continuation of a wrapped usage string.
      lastMethod.signature += "\n" + trimmedRight;
    }
  }

  return { categories, names };
}

let cache: ParsedHelp | null = null;

/** Fetch + parse the daemon's method list once, then serve from memory. */
export async function getMethods(): Promise<ParsedHelp> {
  if (cache) return cache;
  const raw = await client.call("help");
  if (typeof raw !== "string") {
    throw new Error("Unexpected `help` response: expected a string");
  }
  cache = parseHelp(raw);
  return cache;
}
