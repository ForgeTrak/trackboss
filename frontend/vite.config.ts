/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/**/*.test.{ts,tsx}'],
    env: {
      VITE_API_URL: 'http://vitest-api.test',
    },
    server: {
      deps: {
        // Let vi.mock('@zag-js/focus-visible') apply to Chakra's Switch/Checkbox imports.
        inline: [/@zag-js\/focus-visible/, /@chakra-ui\/react/],
      },
    },
  },
});
