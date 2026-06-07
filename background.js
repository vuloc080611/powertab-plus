// background.js
import { saveSession as storeSession, getSessions } from './storage-utils.js';

// Khi cài đặt hoặc cập nhật
chrome.runtime.onInstalled.addListener(async (details) => {
  // Khởi tạo dữ liệu mặc định nếu chưa có
  const sessions = await getSessions();
  if (!sessions.length) {
    await chrome.storage.local.set({ sessions: [], notes: '', darkModeSites: {} });
  }

  if (details.reason === 'install') {
    // Mở trang chào mừng hoặc hướng dẫn
    chrome.tabs.create({ url: 'https://github.com/YOUR_USERNAME/powertab-plus' });
  }
});

// Lắng nghe phím tắt
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-session') {
    await saveCurrentSession();
  } else if (command === 'toggle-dark-mode') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleDarkMode' });
    }
  }
});

// Hàm lưu phiên (được gọi từ shortcut hoặc từ popup qua message)
async function saveCurrentSession() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const session = {
    id: Date.now(),
    name: `Phiên ${new Date().toLocaleString()}`,
    tabs: tabs.map(t => ({
      url: t.url,
      title: t.title,
      favIconUrl: t.favIconUrl
    })),
    createdAt: Date.now()
  };
  await storeSession(session);
  // Có thể hiển thị notification nếu có quyền (cần thêm "notifications" vào permissions)
  // chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon128.png', title: 'PowerTab Plus', message: 'Đã lưu phiên!' });
}

// Lắng nghe message từ popup hoặc content
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveSession') {
    saveCurrentSession().then(() => sendResponse({ success: true }));
    return true; // giữ kênh cho async
  } else if (message.action === 'getSessions') {
    getSessions().then(sessions => sendResponse(sessions));
    return true;
  } else if (message.action === 'deleteSession') {
    import('./storage-utils.js').then(({ deleteSession }) => {
      deleteSession(message.sessionId).then(sessions => sendResponse(sessions));
    });
    return true;
  }
});
