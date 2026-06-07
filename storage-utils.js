// storage-utils.js
// Các hàm thao tác với chrome.storage.local

const KEYS = {
  SESSIONS: 'sessions',
  NOTES: 'notes',
  DARK_MODE_SITES: 'darkModeSites'
};

export async function getSessions() {
  const data = await chrome.storage.local.get(KEYS.SESSIONS);
  return data[KEYS.SESSIONS] || [];
}

export async function saveSession(session) {
  const sessions = await getSessions();
  sessions.push(session);
  await chrome.storage.local.set({ [KEYS.SESSIONS]: sessions });
  return sessions;
}

export async function deleteSession(sessionId) {
  let sessions = await getSessions();
  sessions = sessions.filter(s => s.id !== sessionId);
  await chrome.storage.local.set({ [KEYS.SESSIONS]: sessions });
  return sessions;
}

export async function getNotes() {
  const data = await chrome.storage.local.get(KEYS.NOTES);
  return data[KEYS.NOTES] || '';
}

export async function saveNotes(text) {
  await chrome.storage.local.set({ [KEYS.NOTES]: text });
}

export async function getDarkModeSites() {
  const data = await chrome.storage.local.get(KEYS.DARK_MODE_SITES);
  return data[KEYS.DARK_MODE_SITES] || {};
}

export async function setDarkModeSite(host, enabled) {
  const sites = await getDarkModeSites();
  if (enabled) {
    sites[host] = true;
  } else {
    delete sites[host];
  }
  await chrome.storage.local.set({ [KEYS.DARK_MODE_SITES]: sites });
}
