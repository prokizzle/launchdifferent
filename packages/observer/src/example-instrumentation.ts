// Example: copy this pattern into your Next.js project's instrumentation.ts
//
// import { createObserverInstrumentation } from '@launchdifferent/observer';
//
// const observer = createObserverInstrumentation({
//   dbPath: '.launchdifferent/observer.db',
// });
//
// export const onRequestError = observer.onRequestError;
//
// Then ensure your next.config.ts has:
//   experimental: { instrumentationHook: true }
