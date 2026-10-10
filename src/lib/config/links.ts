// Deep-link identity (per app).
// Custom schemes work with zero server setup: `edubac://search`.
// HTTPS hosts additionally need an assetlinks.json on the domain
// before Android will route them straight into the app.

/** Custom URL schemes this app answers to. New project = rename. */
export const APP_SCHEMES = ['edubac'] as const;

/** HTTPS hosts treated as app links. Add yours + assetlinks.json when known. */
export const APP_HOSTS = ['edubac.app'] as const;

/** Non-tab in-app paths a link may land on. Tabs are always allowed. */
export const EXTRA_LINK_PATHS = ['/login', '/onboarding', '/welcome'] as const;
