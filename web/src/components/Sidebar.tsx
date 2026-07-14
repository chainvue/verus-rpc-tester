import { useMemo, useState } from "react";
import type { MethodCategory, MethodEntry } from "../types";

interface Props {
  categories: MethodCategory[];
  selected: string | null;
  onSelect: (m: MethodEntry) => void;
}

export function Sidebar({ categories, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        methods: c.methods.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.signature.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.methods.length > 0);
  }, [categories, query]);

  const total = useMemo(
    () => categories.reduce((n, c) => n + c.methods.length, 0),
    [categories],
  );

  return (
    <nav className="sidebar">
      <div className="search-wrap">
        <input
          className="search"
          placeholder={`Search ${total} methods…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="method-list">
        {filtered.map((cat) => {
          const isCollapsed = collapsed[cat.category] && !query;
          return (
            <div key={cat.category} className="cat">
              <button
                className="cat-header"
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [cat.category]: !c[cat.category] }))
                }
              >
                <span className={`chevron ${isCollapsed ? "" : "open"}`}>▸</span>
                {cat.category}
                <span className="cat-count">{cat.methods.length}</span>
              </button>
              {!isCollapsed && (
                <ul>
                  {cat.methods.map((m) => (
                    <li key={m.name}>
                      <button
                        className={`method-item ${selected === m.name ? "active" : ""}`}
                        onClick={() => onSelect(m)}
                        title={m.signature}
                      >
                        <span className="method-name">{m.name}</span>
                        {m.dangerous && (
                          <span className="danger-badge" title="Mutating / destructive method">
                            ⚠
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="empty">No methods match “{query}”.</div>}
      </div>
    </nav>
  );
}
