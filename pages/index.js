import fs from "fs";
import path from "path";
import Head from "next/head";
import Script from "next/script";

export async function getServerSideProps() {
  const htmlPath = path.join(process.cwd(), "public", "index.html");
  const full = fs.readFileSync(htmlPath, "utf-8");
  // extract only <body> so we can control CSS/JS loading
  const match = full.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = match ? match[1] : full;
  return { props: { body } };
}

export default function Home({ body }) {
  return (
    <>
      <Head>
        {/* SEO (edit as you like) */}
        <title>Fighting Fucking Fitness — Forbidden Science</title>
        <meta
          name="description"
          content="1,200+ peer-reviewed studies distilled into protocols that improve energy, libido, and performance."
        />
        <link rel="canonical" href="https://fff-site.vercel.app/" />
        <meta property="og:title" content="The Forbidden Science" />
        <meta
          property="og:description"
          content="We read the research. We test the protocols. We share what actually works."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fff-site.vercel.app/" />

        {/* Manus CSS from /public */}
        <link rel="stylesheet" href="/index-3C0zujvJ.css" />
      </Head>

      {/* Render Manus HTML */}
      <div dangerouslySetInnerHTML={{ __html: body }} />

      {/* Manus JS from /public (runs on client) */}
      <Script src="/index-Ddi3IMu4.js" strategy="afterInteractive" />

      {/* Robust wiring for CTAs + header links (match by text) */}
      <Script id="wire-cta" strategy="afterInteractive">
        {`
          function byText(roots, targets){
            const list = Array.from(roots.querySelectorAll('a,button'));
            const found = {};
            list.forEach(el => {
              const t = (el.textContent || '').trim().toLowerCase();
              targets.forEach(([key, substr]) => {
                if (t.includes(substr) && !found[key]) found[key] = el;
              });
            });
            return found;
          }

          function route(el, href){
            if(!el) return;
            el.addEventListener('click', (e) => {
              // don't hijack if it's already a real link to somewhere else
              const isAnchor = el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href') !== '#';
              if (isAnchor) return;
              e.preventDefault();
              window.location.href = href;
            }, { once: true });
          }

          function wire(){
            const targets = [
              ['explore', 'explore the research'],
              ['browse',  'browse protocols'],
              // header items (optional):
              ['navResearch', 'research'],
              ['navProtocols','protocols'],
              ['navTopics',   'topics'],
              ['navGetStarted','get started']
            ];
            const found = byText(document, targets);

            route(found.explore, '/articles');
            route(found.browse,  '/protocols');

            // header routes (adjust if you want different URLs)
            route(found.navResearch,  '/articles');
            route(found.navProtocols, '/protocols');
            route(found.navTopics,    '/topics');     // create this page when ready
            route(found.navGetStarted,'/get-started'); // create this page when ready
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', wire, { once: true });
          } else {
            wire();
          }
        `}
      </Script>
    </>
  );
}
