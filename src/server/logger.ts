// Minimal structured logger. Central place to forward errors to an external
// service (Sentry/Logtail/Datadog) later — wire it in `forward()` when you add
// a SENTRY_DSN, without touching call sites.
type Level = "info" | "warn" | "error";

function forward(/* entry: Record<string, unknown> */) {
  // e.g. if (process.env.SENTRY_DSN) Sentry.captureMessage(...)
}

export function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = { level, message, at: new Date().toISOString(), ...meta };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  forward();
}

export function logError(message: string, error: unknown, meta?: Record<string, unknown>) {
  log("error", message, {
    ...meta,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error),
  });
}
