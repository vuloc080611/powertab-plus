import { getNotes, saveNotes } from './storage-utils.js';

const notesArea = document.getElementById('notes-area');
const searchInput = document.getElementById('search-tabs');
const tabList = document.getElementById('tab-list');

// Load notes
async function loadNotes() {
  const notes = await getNotes();
  notesArea.value = notes;
}
notesArea.addEventListener('input', async () => {
  await saveNotes(notesArea.value);
});

// Load tabs
async function loadTabs(filter = '') {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const filtered = tabs.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()) || t.url.toLowerCase().includes(filter.toLowerCase()));
  tabList.innerHTML = '';
  filtered.forEach(tab => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.innerHTML = `<img src="${tab.favIconUrl || 'icons/icon16.png'}"><span>${escapeHtml(tab.title)}</span>`;
    li.addEventListener('click', () => {
      chrome.tabs.update(tab.id, { active: true });
    });
    tabList.appendChild(li);
  });
}

searchInput.addEventListener('input', (e) => loadTabs(e.target.value));

// Initialize
loadNotes();
loadTabs();

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
