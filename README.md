# 🧠 Recally

Recally helps you **save and recall the articles, blogs, and docs you read online** — so you never lose track of what inspired you again.

---

## 🚀 Overview

Recally is starting as a lightweight **browser extension** that lets you:

1. **Save** the current tab (title, URL, tags)
2. **View** your list of previously saved posts
3. (Coming soon) Sync your reading list across devices

Over time, Recally will evolve into a full **web app + backend**, where you can organize, tag, and search everything you’ve read — like a personal “knowledge log” for your online reading.

---

## 🧱 Project Structure

```
recally/
│
├── extension/ # Browser extension (current focus)
│ ├── src/
│ │ ├── popup/ # Popup UI (save + view)
│ │ ├── background/ # Background scripts (listeners, sync)
│ │ ├── content/ # Optional injected scripts
│ │ ├── assets/ # Icons and images
│ │ └── styles/ # Popup CSS
│ ├── manifest.json # Extension manifest (MV3)
│ ├── package.json # Optional if bundler is added
│ └── vite.config.js # Optional if using Vite/Rollup
│
├── web/ # Future web dashboard
├── RecallySrv/ # Future backend service
└── docs/ # Architecture & design docs
```

## Technical Details
### Running the app

There is nothing to run currently lol. But coming soon

### Developing

The technology used to develop Recally is still being decided but I expected Typescript on the frontend and React on the backend
For more details on the roadmap, see [Highlevel roadMap](https://docs.google.com/document/d/1WsfJWlSeQEt3m74yXUaScKw1gqs6-Wdkpq4fMlcyEv8/edit?tab=t.0)