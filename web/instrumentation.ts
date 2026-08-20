import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_PUBLIC_NEXT_RUNTIME === 'nextjs') {
    await import('./sentry.client.config');
  }

  if (process.env.NEXT_PUBLIC_NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
