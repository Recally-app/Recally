// extension/src/popup/popup.ts
import { StorageManager } from '../storage/storageManager';

document.addEventListener('DOMContentLoaded', async () => {
  const saveButton = document.querySelector<HTMLButtonElement>(".save-btn");
if (!saveButton) {
  console.error("Save button not found");
} else {
  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    const originalText = saveButton.textContent;
    saveButton.textContent = "Saving...";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || !tab?.title) throw new Error("Missing tab info");

      await StorageManager.savePost(tab.url, tab.title);

      saveButton.textContent = "Saved!";
      saveButton.classList.add("success");
    } catch (error) {
      console.error("Save failed:", error);
      saveButton.textContent = "Failed to save";
      saveButton.classList.add("error");
    }

    // revert after delay
    setTimeout(() => {
      saveButton.disabled = false;
      saveButton.textContent = originalText;
      saveButton.classList.remove("success", "error");
    }, 1500);
  });
}
  const savedList = document.getElementById('saved-posts') as HTMLUListElement;

  // Initial render
  await renderPosts();

  // Handle save
  saveButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !tab?.title) return;

    await StorageManager.savePost(tab.url, tab.title);
    await renderPosts();
  });


  // Renders all posts dynamically
  async function renderPosts() {
    const posts = await StorageManager.getAllPosts();
    savedList.innerHTML = '';

    if (posts.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.textContent = 'No saved posts yet.';
      emptyState.className = 'empty-state';
      savedList.appendChild(emptyState);
      return;
    }

    for (const post of posts) {
      const li = document.createElement('li');
      li.className = 'saved-post';

      // You can replace this with a real favicon fetch later
      const thumb = document.createElement('div');
      thumb.className = 'post-thumb';

      const info = document.createElement('div');
      info.className = 'post-info';

      const website = document.createElement('p');
      website.className = 'post-website';
      website.textContent = new URL(post.url).hostname.replace('www.', '');

      const title = document.createElement('p');
      title.className = 'post-title';
      title.textContent = post.title;

      const tags = document.createElement('p');
      tags.className = 'post-tags';
      tags.textContent = post.tags?.length ? `Tags: ${post.tags.join(', ')}` : '';

      info.appendChild(website);
      info.appendChild(title);
      info.appendChild(tags);

      li.appendChild(thumb);
      li.appendChild(info);
      savedList.appendChild(li);
    }
  }
});
