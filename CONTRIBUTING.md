# Contributing to Recally

## Commit Message Guidelines

**Keep commit messages concise: 3 sentences or less.**

Format:
```
<type>: <short description>

<1-2 sentence explanation of what changed and why>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

### Examples

Good:
```
fix: folders now store post IDs instead of full objects

Prevents stale data when posts are updated. Posts are fetched fresh from the database on access.
```

Bad:
```
fix: refactor folders to store post IDs instead of full Post objects

Critical data consistency fix:
- Folders now store post_ids array instead of embedding full Post objects
- Prevents stale data when posts are updated (tags, notes, etc.)
- Reduces storage duplication
- Posts are fetched fresh from posts table via getPostsByFolderId()

Changes:
- Updated Folder model: posts: Post[] -> post_ids: string[]
- Added DB migration v4 to convert existing data
...
```

## Code Style

- No emojis in code, commits, or documentation (except ✓/✗ for test results)
- Run `npm run lint:fix` before committing
- Follow existing patterns in the codebase
