import manifest from './manifest.config';
import { crx } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [crx({ manifest })],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
