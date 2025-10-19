const KEY = "fff_reading_list_v1";

export function getReadingList(){
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function isSaved(id){
  return getReadingList().some(x => x.id === id);
}
export function toggleSave(item){
  const list = getReadingList();
  const i = list.findIndex(x => x.id === item.id);
  if (i >= 0) list.splice(i,1);
  else list.unshift({ id:item.id, title:item.title||"Untitled", cluster:item.cluster||"", date:item.date||"", when:Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0,300)));
  return isSaved(item.id);
}
