// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://68d06ef4158e2649a6e71bf7a6a5d1dc@o4509086037770240.ingest.de.sentry.io/4509086097080400",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// This is the client-side instrumentation file
// It loads the client-side Sentry SDK

export function register() {
  // Sentry removed
} 