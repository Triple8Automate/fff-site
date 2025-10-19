// lib/readingList.js
const KEY = "fffReadingList";

export function getReadingList() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isSaved(idOrItem) {
  const id = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
  if (!id) return false;
  const list = getReadingList();
  return list.some((x) => x.id === id);
}

export function saveItem(item) {
  if (typeof window === "undefined") return;
  const list = getReadingList();
  if (!list.some((x) => x.id === item.id)) {
    list.unshift({
      id: item.id,
      title: item.title || "Untitled",
      cluster: item.cluster || "",
      date: item.date || "",
      savedAt: Date.now(),
    });
    window.localStorage.setItem(KEY, JSON.stringify(list));
  }
}

export function removeItem(id) {
  if (typeof window === "undefined") return;
  const list = getReadingList().filter((x) => x.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function toggleSave(item) {
  if (isSaved(item)) {
    removeItem(item.id);
    return false;
  } else {
    saveItem(item);
    return true;
  }
}

export function clearReadingList() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, "[]");
}
