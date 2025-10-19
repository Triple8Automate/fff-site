// lib/readingList.js
const KEY = "fffReadingList";

export function getReadingList() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function isSaved(id) {
  return getReadingList().some((x) => x.id === id);
}

export function toggleSave(entry) {
  const list = getReadingList();
  const i = list.findIndex((x) => x.id === entry.id);
  if (i >= 0) {
    list.splice(i, 1);
    localStorage.setItem(KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ ...entry, savedAt: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list));
  return true;
}
