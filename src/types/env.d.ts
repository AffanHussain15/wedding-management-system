/**
 * Types for the `@env` module that `react-native-dotenv` generates from `.env`
 * at build time. Every key is optional: a blank or missing line reaches the app
 * as `undefined`, and `services/config.ts` supplies the fallback.
 */

declare module '@env' {
  export const API_HOST: string | undefined;
  export const API_PREFIX: string | undefined;
  export const REQUEST_TIMEOUT_MS: string | undefined;
}
