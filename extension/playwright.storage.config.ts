import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/storage',
    workers: 1,
    reporter: 'list',
});
