import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export function getAllPosts() {
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".md"));
  return files.map(filename => {
    const slug = filename.replace(".md", "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
    const { data } = matter(raw);
    return {
      slug,
      title: data.title || slug,
      date: data.date || null
    };
  }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}
