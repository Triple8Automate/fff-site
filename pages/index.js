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
        {/* --- SEO METADATA --- */}
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

        {/* --- Load Manus CSS --- */}
        <link rel="stylesheet" href="/index-3C0zujvJ.css" />
      </Head>

      {/* --- Render the HTML BODY --- */}
      <div dangerouslySetInnerHTML={{ __html: body }} />

      {/* --- Load Manus JavaScript so it executes --- */}
      <Script src="/index-Ddi3IMu4.js" strategy="afterInteractive" />

      {/* --- Wire up CTA buttons to live routes --- */}
      <Script id="wire-cta" strategy="afterInteractive">
        {`
          // Update these selectors if Manus used different classes/ids
          const explore = document.querySelector('a[href="#explore"], button[data-cta="explore"]');
          const browse  = document.querySelector('a[href="#protocols"], button[data-cta="protocols"]');
          if (explore)  explore.addEventListener('click', e => { e.preventDefault(); window.location.href = '/articles'; });
          if (browse)   browse.addEventListener('click',  e => { e.preventDefault(); window.location.href = '/protocols'; });
        `}
      </Script>
    </>
  );
}
