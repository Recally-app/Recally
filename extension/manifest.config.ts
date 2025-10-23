import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.displayName || 'Recally',
  version: pkg.version,
  description: 'Save and recall the articles and posts you read online.',

  action: {
    default_popup: 'src/popup/index.html',
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  permissions: ['storage', 'tabs'],
  host_permissions: ['<all_urls>'],
})
