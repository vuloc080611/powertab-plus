// content.js
// Dark Mode bằng filter CSS + class

const DARK_CLASS = 'powertab-dark-mode';

function injectDarkStyles() {
  if (document.getElementById('powertab-dark-style')) return;
  const style = document.createElement('style');
  style.id = 'powertab-dark-style';
  style.textContent = `
    html.${DARK_CLASS} {
      filter: invert(1) hue-rotate(180deg) !important;
      background-color: #111 !important;
    }
    html.${DARK_CLASS} img,
    html.${DARK_CLASS} video,
    html.${DARK_CLASS} iframe,
    html.${DARK_CLASS} [style*="background-image"] {
      filter: invert(1) hue-rotate(180deg) !important;
    }
  `;
  document.head.appendChild(style);
}

function removeDarkStyles() {
  const el = document.getElementById('powertab-dark-style');
  if (el) el.remove();
}

function applyDarkMode(enable) {
  const html = document.documentElement;
  if (enable) {
    html.classList.add(DARK_CLASS);
    injectDarkStyles();
  } else {
    html.classList.remove(DARK_CLASS);
    removeDarkStyles();
  }
  // Lưu trạng thái qua storage (content script có quyền storage)
  chrome.storage.local.get('darkModeSites', (data) => {
    const sites = data.darkModeSites || {};
    sites[location.hostname] = enable;
    chrome.storage.local.set({ darkModeSites: sites });
  });
}

// Lắng nghe message từ background/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleDarkMode') {
    const isDark = document.documentElement.classList.contains(DARK_CLASS);
    applyDarkMode(!isDark);
    sendResponse({ success: true, isDark: !isDark });
  } else if (message.action === 'getDarkModeState') {
    sendResponse({ isDark: document.documentElement.classList.contains(DARK_CLASS) });
  }
  return true;
});

// Khi load trang, khôi phục dark mode nếu đã lưu
chrome.storage.local.get('darkModeSites', (data) => {
  const sites = data.darkModeSites || {};
  if (sites[location.hostname]) {
    applyDarkMode(true);
  }
});
