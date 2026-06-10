"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_PRIORITY_CONFIG, evaluatePriority } from "@/lib/crm";

const STORAGE_KEY = "lf_priority_config";
const Ctx = createContext(null);

// Provides the user's priority rules (persisted in localStorage) and a
// priorityOf(lead) helper. Changing the rules re-colours every badge live.
export function PriorityProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_PRIORITY_CONFIG);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function save(next) {
    setConfig(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function reset() {
    save(DEFAULT_PRIORITY_CONFIG);
  }

  const value = {
    config,
    setConfig: save,
    reset,
    priorityOf: (lead) => evaluatePriority(lead, config),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePriority() {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  // Fallback when used outside the provider: behave with default rules.
  return {
    config: DEFAULT_PRIORITY_CONFIG,
    setConfig: () => {},
    reset: () => {},
    priorityOf: (lead) => evaluatePriority(lead, DEFAULT_PRIORITY_CONFIG),
  };
}
