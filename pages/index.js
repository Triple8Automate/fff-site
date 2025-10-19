import fs from "fs";
import path from "path";

export async function getStaticProps() {
  const htmlPath = path.join(process.cwd(), "public", "index.html");
  let html = fs.readFileSync(htmlPath, "utf-8");

  // Fix relative paths to work with Next.js public folder
  html = html
    .replace(/href="\.\/index-3C0zujvJ\.css"/g, 'href="/index-3C0zujvJ.css"')
    .replace(/src="\.\/index-Ddi3IMu4\.js"/g, 'src="/index-Ddi3IMu4.js"');

  return { props: { html } };
}

export default function Home({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
