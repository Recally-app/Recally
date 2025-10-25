import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
    manifest_version: 3,
    name: pkg.displayName || 'Recally',
    version: pkg.version,
    description: 'Save and recall the articles and posts you read online.',

    action: {
        default_icon: {
            16: 'src/assets/icon/favicon-16.png',
            32: 'src/assets/icon/favicon-32.png',
            48: 'src/assets/icon/favicon-48.png',
        },
        default_popup: 'src/popup/index.html',
    },

    background: {
        service_worker: 'src/background/index.ts',
        type: 'module',
    },

    icons: {
        16: 'src/assets/icon/favicon-16.png',
        32: 'src/assets/icon/favicon-32.png',
        48: 'src/assets/icon/favicon-48.png',
        128: 'src/assets/icon/favicon-128.png',
    },

    permissions: ['storage', 'tabs'],
    host_permissions: ['<all_urls>'],
});
