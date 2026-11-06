/// <reference types="vite/client" />

/** Injected by vite.config.ts from package.json. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** The key the game signs its tournament results with (docs/TORNEO.md). A GitHub secret given to the release build; never in the repository. */
  readonly VITE_PIXELDEBH_TORNEO_CHIAVE?: string;
  /** Only for a test build: another address for the tournament (the site's development server). Default: www.pixeldebh.it. */
  readonly VITE_PIXELDEBH_TORNEO_URL?: string;
}
