import manifest from './manifest.config';
import { crx } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        crx({ manifest })
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
