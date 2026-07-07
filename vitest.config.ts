import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    // maps-core ships ESM that named-imports from maplibre-gl (CJS). Inline it
    // so Vite transforms the module and handles the CJS/ESM interop.
    server: {
      deps: {
        inline: ['@geolonia/maps-core'],
      },
    },
  },
});
