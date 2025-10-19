import fs from "fs";
import path from "path";
import Head from "next/head";
import Script from "next/script";

export async function getStaticProps() {
  const htmlPath = path.join(process.cwd(), "public", "index.html");
  const full = fs.readFileSync(htmlPath, "utf-8");
  // grab only the BODY so scripts/styles can be attached properly
  const match = full.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = match ? match[1] : full;
  return { props: { body } };
}

export default function Home({ body }) {
  return (
    <>
      <Head>
        {/* load Manus CSS from /public */}
        <link rel="stylesheet" href="/index-3C0zujvJ.css" />
      </Head>

      {/* render body markup */}
      <div dangerouslySetInnerHTML={{ __html: body }} />

      {/* load Manus JS so it actually executes */}
      <Script src="/index-Ddi3IMu4.js" strategy="afterInteractive" />
    </>
  );
}
