import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  use: { baseURL: 'http://127.0.0.1:3107', browserName: 'chromium' },
  webServer: {
    command: 'node src/server.js',
    url: 'http://127.0.0.1:3107/health',
    env: { PORT: '3107', UI_PREVIEW: 'true', NODE_ENV: 'test' },
    reuseExistingServer: false
  }
});
