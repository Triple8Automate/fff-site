import Link from "next/link";
import { getAllPosts } from "../../lib/posts";

export async function getStaticProps() {
  return { props: { posts: getAllPosts() } };
}

export default function Articles({ posts }) {
  return (
    <main style={{minHeight:"100vh",padding:"3rem",maxWidth:900,margin:"0 auto"}}>
      <h1>Explore the Research</h1>
      <p>Evidence-driven summaries from the Forbidden Science archive.</p>
      <ul style={{listStyle:"none",padding:0}}>
        {posts.map(p => (
          <li key={p.slug} style={{margin:"1rem 0"}}>
            <Link href={`/articles/${p.slug}`} style={{textDecoration:"none"}}>
              <strong>{p.title}</strong>
            </Link>
            {p.date ? <div style={{fontSize:14,opacity:.7}}>{p.date}</div> : null}
          </li>
        ))}
      </ul>
      <p style={{marginTop:"2rem",opacity:.7}}>
        Tip: add more Markdown files to <code>/content</code> to auto-publish.
      </p>
    </main>
  );
}
