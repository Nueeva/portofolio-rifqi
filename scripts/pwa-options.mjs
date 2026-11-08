export const pwaOptions = {
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.svg", "favicon.ico", "apple-touch-icon.png", "robots.txt"],
      manifest: {
        name: "RifqiA - Cybersecurity Engineer",
        short_name: "RifqiA",
        description: "Rifqi Ariansyah - Cybersecurity Engineer Portfolio",
        theme_color: "#0b181c",
        background_color: "#0b181c",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // The lazy three.js chunk (±747 KB) and the admin chunk (±548 KB)
        // are excluded from the precache below (globIgnores): every first
        // visit used to download ±1.3 MB it may never run. They are
        // runtime-cached on first actual use instead (see runtimeCaching).
        // Cache strategies for different resource types.
        // (Fonts are self-hosted since the 2026-10-26 upgrade wave — the old
        // Google Fonts cache rules were removed with the CDN dependency.)
        runtimeCaching: [
          {
            // Lazy app chunks (three.js hero scene, admin): content-hashed
            // and served immutable, so cache-first is safe.
            urlPattern: /\/assets\/[^/]+\.js$/,
            handler: "CacheFirst",
            options: {
              cacheName: "app-js-chunks",
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache other images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        // Pre-cache important routes — minus the two heavy lazy chunks
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/assets/three-*.js", "**/assets/Admin-*.js"],
        // Skip waiting to activate new service worker immediately
        skipWaiting: true,
        clientsClaim: true,
      },
    };
