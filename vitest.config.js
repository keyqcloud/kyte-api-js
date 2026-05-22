import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom gives us document, window, document.cookie, etc. — kyte-source.js
    // talks to all three. The library is not currently structured as ES modules,
    // so we load it into the test environment via tests/setup.js below.
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    include: ['tests/**/*.test.js'],
  },
});
