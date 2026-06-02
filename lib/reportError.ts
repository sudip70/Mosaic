import * as Sentry from '@sentry/react-native';

/**
 * Single entry point for reporting handled (caught) errors. Keeps Sentry out
 * of feature code and ensures swallowed errors are still observable.
 * Safe to call from non-React modules (lib/, stores) as well as hooks.
 */
export function reportError(error: unknown, context?: Record<string, string>) {
  const err = error instanceof Error ? error : new Error(String(error));
  if (__DEV__) {
    // Surface during development; Sentry is disabled with a placeholder DSN.
    console.warn(`[reportError]${context ? ` ${JSON.stringify(context)}` : ''}`, err.message);
  }
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}
