// dsh-plugin-splash — host half: standalone PWA manifest route.
//
// Graduated from the dynamic plugin whale-1/pkg-1 (2026-08-28). Registers a
// named exact route on the webServer service that takes precedence over the
// dist fallback server's shipped /manifest.webmanifest (display: fullscreen)
// and serves a standalone manifest instead, so the GUI installs as a proper
// app window with its own taskbar icon. Route disposal rides the plugin
// fiber, so disabling the plugin row removes the override cleanly.

export const inject = ['webServer']

const MANIFEST = JSON.stringify({
  id: '/',
  name: 'DeepSeek Harness',
  short_name: 'DSH',
  description: 'DeepSeek Harness - local agent workspace.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  display_override: ['standalone'],
  background_color: '#ffffff',
  theme_color: '#ffffff',
  icons: [
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
})

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/manifest.webmanifest',
    handler: (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-cache',
      })
      res.end(MANIFEST)
    },
  }), 'splash: PWA manifest route')
}
