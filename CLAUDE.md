# Claude AI Assistant Guide for Recally

This document provides context and guidelines for AI assistants (like Claude) working on the Recally codebase.

---

## Project Overview

**Recally** is a browser extension that helps users save, organize, and recall web content they read online. Think of it as a personal knowledge management system for articles, blogs, and documentation.

**Current Focus:** Chrome extension with local storage (IndexedDB via Dexie)
**Future Plans:** Web dashboard + backend service for cross-device sync

---

## Repository Structure

```
/Recally
├── extension/          # Main Chrome extension (React + TypeScript)
│   ├── src/
│   │   ├── popup/      # Main UI (popup.tsx is the primary interface)
│   │   ├── components/ # Reusable React components
│   │   ├── storage/    # Database & storage abstractions
│   │   ├── background/ # Service worker scripts
│   │   └── assets/     # Icons, images, SVGs
│   ├── manifest.config.ts
│   └── package.json
│
├── shared/             # Shared TypeScript types/models
│   ├── models/         # Post, Folder data models
│   └── storage/        # Storage type definitions
│
├── web/                # (Future) Web dashboard
├── RecallySrv/         # (Future) Backend service
├── branding/           # Design system (colors.md, fonts.md, logos)
└── docs/               # Feature specs and documentation
```

---

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite with @crxjs/vite-plugin
- **Database:** Dexie (IndexedDB wrapper)
- **Styling:** TailwindCSS 4
- **Linting:** ESLint + Prettier
- **Git Hooks:** Lefthook (pre-commit formatting)

---

## Core Data Models

### Post (`shared/models/post.ts`)
```typescript
interface Post {
  id: string;                    // UUID
  url: string;                   // Original URL
  canonical_url: string;         // Normalized for duplicate detection
  title: string;                 // Page title
  tags: string[];                // User-added tags
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  notes?: string;                // User notes
  favicon_url?: string;          // Cached favicon
}
```

### Folder (`shared/models/folder.ts`)
```typescript
interface Folder {
  id: string;                    // UUID
  name: string;                  // Folder name
  color: string;                 // Hex color code (e.g., '#3B82F6')
  posts: Post[];                 // Embedded posts (NOT IDs)
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  order?: number;                // Custom sort order
}
```

**Important:** Folders store **full Post objects**, not just IDs. This was changed in DB version 3.

---

## Key Files & Entry Points

### Extension Entry Points
- `extension/src/popup/popup.tsx` - Main popup UI logic (500+ lines)
- `extension/src/popup/main.tsx` - React root render
- `extension/src/background/index.ts` - Background service worker
- `extension/manifest.config.ts` - Extension manifest configuration

### Storage Layer
- `extension/src/storage/db.ts` - Dexie database schema (3 versions)
- `extension/src/storage/storageManager.ts` - CRUD operations for posts/folders
- `extension/src/storage/localStorageProvider.ts` - chrome.storage.local wrapper
- `extension/src/storage/userPreferences.ts` - User settings

### Components
- `SavedFolderItem.tsx` - Folder card component
- `CompactPostItem.tsx` - Compact post display
- `CreateFolderModal.tsx` - Modal for creating folders
- `EditFolderModal.tsx` - Modal for editing folders
- `ManageTabsModal.tsx` - Pinned tabs management
- `PinnedTabsBar.tsx` - Horizontal pinned tabs display
- `ConfirmModal.tsx` - Generic confirmation dialog
- `FolderColorPicker.tsx` - Custom color picker

---

## Development Workflow

### Setup
```bash
cd extension
npm install
```

### Development
```bash
npm run dev          # Start Vite dev server with hot reload
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
```

### Loading in Chrome
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist/` folder
5. Extension icon appears in toolbar

### Git Workflow
- **Main branch:** `dev` (not `main`)
- **Current branch:** `feature/folder-implementation`
- Lefthook runs pre-commit linting/formatting automatically

---

## Important Patterns & Conventions

### Database Migrations
The Dexie schema is currently at **version 3**. When adding new fields:
1. Increment version number
2. Add migration logic in `.upgrade()` callback
3. Test with existing user data

### Storage Operations
Always use `StorageManager` class instead of direct Dexie calls:
```typescript
import { StorageManager } from '../storage/storageManager';

const storage = new StorageManager();
await storage.savePost(post);
await storage.getFolder(folderId);
```

### Folder-Post Relationship
- Folders embed full `Post[]` objects (not just IDs)
- When adding a post to a folder, copy the entire post object
- Keep the `posts` table and folder posts in sync

### Styling
- Follow design system in `branding/colors.md` and `branding/fonts.md`
- Use TailwindCSS classes (configured in v4)
- Use SVG icons from `extension/src/assets/icon/`

---

## Common Tasks & Gotchas

### Adding a New Field to Post/Folder
1. Update type in `shared/models/`
2. Compile shared types: `cd shared && tsc`
3. Update Dexie schema in `extension/src/storage/db.ts` (new version + migration)
4. Update UI components that display the field

### Working with IndexedDB
- Dexie handles async operations - always `await`
- Use transactions for batch operations
- Index fields you'll query frequently (see `db.ts` schema)

### Favicon Handling
- Favicons are fetched from DuckDuckGo's icon service
- Stored as `favicon_url` in Post
- Falls back gracefully if fetch fails

### Chrome Extension Permissions
- Current permissions: `storage`, `tabs`, `<all_urls>`
- Declared in `manifest.config.ts`

---

## Testing & Debugging

### Browser DevTools
- Right-click extension icon → "Inspect popup" (UI debugging)
- `chrome://extensions` → "Inspect views: background page" (service worker)

### Common Issues
- **Hot reload not working:** Refresh extension in `chrome://extensions`
- **Storage not persisting:** Check IndexedDB in DevTools → Application tab
- **Build errors:** Clear `node_modules` and reinstall

---

## Code Style

- **TypeScript:** Strict mode enabled
- **React:** Functional components with hooks
- **Naming:** camelCase for variables, PascalCase for components
- **Formatting:** Prettier (runs on pre-commit)
- **Linting:** ESLint flat config (`eslint.config.mts`)

### Emoji Policy

**DO NOT use emojis in code, documentation, commits, or UI**

- Only acceptable use: Status indicators in test results or validation
  - ✓ (checkmark) for passing tests or successful operations
  - ✗ (red x) for failing tests or failed operations
- Keep all text professional and emoji-free

---

## Future Roadmap

See `docs/` folder for feature specs. Key upcoming features:
- Import/Export functionality (`docs/IMPORT_EXPORT_FEATURE.md`)
- Web dashboard (`/web`)
- Backend API (`/RecallySrv`)
- Cross-device sync

---

## Getting Help

- **Roadmap:** [High-level roadmap doc](https://docs.google.com/document/d/1WsfJWlSeQEt3m74yXUaScKw1gqs6-Wdkpq4fMlcyEv8/edit?tab=t.0)
- **GitHub:** https://github.com/Recally-app/Recally
- **Issues:** Report bugs/features on GitHub Issues

---

## Tips for AI Assistants

1. **Always check `branding/` before adding colors/fonts**
2. **Use `StorageManager` class, not raw Dexie calls**
3. **Keep `shared/` types in sync with extension code**
4. **Test changes by loading extension in Chrome**
5. **Follow existing component patterns** (see `components/`)
6. **Remember folders store full Post objects, not IDs**
7. **Run `npm run lint:fix` before committing**

---

**Last Updated:** 2026-01-25 (feature/folder-implementation branch)
