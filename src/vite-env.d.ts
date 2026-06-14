/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the deployed API, e.g. https://diya-api.onrender.com/api.
   *  Unset locally → the app uses Vite's '/api' dev proxy. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
