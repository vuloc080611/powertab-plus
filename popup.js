// popup.js (module)
import { getSessions, deleteSession } from './storage-utils.js';

// --- Tab Navigation ---
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = {
  sessions: document.getElementById('sessions-panel'),
  tabs: document.getElementById('tabs-panel'),
  darkmode: document.getElementById('darkmode-panel'),
  notes: document.getElementById('notes-panel')
};

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const panelId = btn.dataset.panel;
    // Active button
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Active panel
    Object.values(panels).forEach(p => p.classList.remove('active'));
    panels[panelId].classList.add('active');

    // Load dữ liệu tương ứng
    if (panelId === 'sessions') loadSessions();
    if (panelId === 'tabs') loadTabs();
    if (panelId === 'darkmode') loadDarkModeState();
    if (panelId === 'notes') loadNotes();
  });
});

// --- Sessions Panel ---
const sessionsList = document.getElementById('sessions-list');
const noSessions = document.getElementById('no-sessions');
const saveSessionBtn = document.getElementById('save-session-btn');

saveSessionBtn.addEventListener('click', async () => {
  // Gửi message cho background lưu session (có thể tự lưu trực tiếp)
  chrome.runtime.sendMessage({ action: 'saveSession' }, async () => {
    await loadSessions();
  });
});

async function loadSessions() {
  const sessions = await getSessions();
  sessionsList.innerHTML = '';
  if (sessions.length === 0) {
    noSessions.style.display = 'block';
    sessionsList.style.display = 'none';
  } else {
    noSessions.style.display = 'none';
    sessionsList.style.display = 'block';
    sessions.forEach(session => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <span class="title" title="Nhấn để khôi phục">${escapeHtml(session.name)} (${session.tabs.length} tab)</span>
        <div class="actions">
          <button class="btn secondary restore-btn" data-id="${session.id}">Mở</button>
          <button class="btn danger delete-btn" data-id="${session.id}">Xoá</button>
        </div>
      `;
      sessionsList.appendChild(li);
    });

    // Gắn sự kiện
    document.querySelectorAll('.restore-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = Number(e.target.dataset.id);
        const sessions = await getSessions();
        const session = sessions.find(s => s.id === id);
        if (session) {
          if (confirm(`Mở ${session.tabs.length} tab trong cửa sổ mới?`)) {
            chrome.windows.create({ url: session.tabs.map(t => t.url) });
          }
        }
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = Number(e.target.dataset.id);
        await deleteSession(id);
        await loadSessions();
      });
    });
  }
}

// --- Tabs Panel ---
const tabsList = document.getElementById('tabs-list');
const tabSearch = document.getElementById('tab-search');

tabSearch.addEventListener('input', loadTabs);

async function loadTabs() {
  const query = tabSearch.value.toLowerCase();
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const filtered = tabs.filter(t => t.title.toLowerCase().includes(query) || t.url.toLowerCase().includes(query));
  tabsList.innerHTML = '';
  filtered.forEach(tab => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.innerHTML = `
      <img src="${tab.favIconUrl || 'icons/icon16.png'}" alt="">
      <span class="title" data-tab-id="${tab.id}">${escapeHtml(tab.title)}</span>
    `;
    li.querySelector('.title').addEventListener('click', () => {
      chrome.tabs.update(tab.id, { active: true });
      window.close(); // đóng popup
    });
    tabsList.appendChild(li);
  });
}

// --- Dark Mode Panel ---
const currentHostSpan = document.getElementById('current-host');
const toggleDarkBtn = document.getElementById('toggle-dark-btn');

async function loadDarkModeState() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    const url = new URL(tab.url);
    currentHostSpan.textContent = url.hostname;
    // Hỏi content script trạng thái hiện tại
    chrome.tabs.sendMessage(tab.id, { action: 'getDarkModeState' }, (response) => {
      if (response) {
        toggleDarkBtn.textContent = response.isDark ? 'Tắt Dark Mode' : 'Bật Dark Mode';
        toggleDarkBtn.className = `btn ${response.isDark ? 'danger' : 'secondary'}`;
      }
    });
  }
}

toggleDarkBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleDarkMode' }, () => {
      loadDarkModeState();
    });
  }
});

// --- Notes Panel ---
const notesArea = document.getElementById('notes-area');
const saveNotesBtn = document.getElementById('save-notes-btn');

async function loadNotes() {
  const notes = await chrome.storage.local.get('notes');
  notesArea.value = notes.notes || '';
}

saveNotesBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ notes: notesArea.value });
  alert('Đã lưu ghi chú!');
});

// --- Helpers ---
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Khởi động panel đầu tiên
loadSessions();
