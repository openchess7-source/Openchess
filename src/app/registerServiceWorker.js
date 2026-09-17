// Registered once from main.jsx. Deliberately skipped in dev (import.meta.env.DEV)
// — a service worker caching Vite's dev server output causes more
// confusion than it's worth while iterating locally.
export function registerServiceWorker() {
  if (import.meta.env.DEV) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // A worker was already waiting when we registered (e.g. a previous
      // tab installed it but hasn't reloaded yet).
      if (registration.waiting) {
        window.dispatchEvent(new CustomEvent('sw-update-available', { detail: { registration } }));
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          // "installed" + an existing controller means this is an UPDATE,
          // not the very first install (which has no controller yet and
          // doesn't need a reload prompt — there's nothing to refresh from).
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('sw-update-available', { detail: { registration } }));
          }
        });
      });
    }).catch(() => {
      // Registration failing (e.g. served over plain HTTP in some preview
      // setups) shouldn't block the app from working online-only.
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}

export function activateWaitingServiceWorker(registration) {
  registration?.waiting?.postMessage('SKIP_WAITING');
}
