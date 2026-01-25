# Git Commit and Push Skill

## Description
Automates the git workflow: status check, add files, commit, push to current branch, and display PR creation URL.

## Usage
When user says "commit and push" or similar, execute this workflow.

## Steps
1. **Check status and diff**
```bash
git status
git diff --stat
```

2. **Add all modified and new files**
- Review git status output to ensure no ignored files are staged
- Verify .gitignore is respected (node_modules, .idea, .DS_Store, /run/, .git/hooks/)
- Only add tracked and relevant files
```bash
git add .
```

3. **Create commit**
- If user provided a commit message, use it
- Otherwise, generate a concise commit message based on the changes
- Format: `<type>: <short description>` (max 3 lines)
- Types: feat, fix, style, refactor, docs, chore
```bash
git commit -m "commit message here"
```

4. **Push to current branch**
```bash
git push origin $(git branch --show-current)
```

5. **Display PR URL**
Extract and show the PR creation URL from the push output.

## Examples
### User: "commit and push"
→ Execute full workflow with auto-generated commit message

### User: "commit and push with message: fix typo in about page"
→ Execute workflow using provided commit message: "fix: typo in about page"

### User: "push this"
→ Execute full workflow with auto-generated commit message

## Notes
- Keep commit messages concise and professional (no emojis per CLAUDE.md)
- Follow conventional commit format: `<type>: <description>`
- Run git status and diff in parallel for speed
- Main branch is `dev` (not `main`)
