import Head from "next/head";
import { useRouter } from "next/router";

export async function getServerSideProps() {
  return { props: {} };
}

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Fighting Fucking Fitness — Research Archive</title>
        <meta
          name="description"
          content="1,200+ peer-reviewed studies on sex, power, and peak performance. Access the research they don't want you to see."
        />
        <link rel="canonical" href="https://fff-site.vercel.app/" />
        <meta property="og:title" content="Fighting Fucking Fitness" />
        <meta
          property="og:description"
          content="We read the research. We test the protocols. We share what actually works."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fff-site.vercel.app/" />
      </Head>

      <main className="gate-container">
        <h1>Fighting Fucking Fitness</h1>
        <p className="subtitle">
          1,200+ peer-reviewed studies on sex, power, and peak performance
        </p>
        <p className="description">
          We read the research they ignore. We test the protocols they suppress.
          We share what actually works.
        </p>

        <button
          onClick={() => router.push("/articles")}
          className="cta-button"
        >
          Access the Research Archive →
        </button>

        <div className="gate-disclaimer">
          Enter your email to unlock full access to our research database
        </div>
      </main>

      <style jsx>{`
        .gate-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
          background: #0b0b0f;
          color: #e5e7eb;
        }

        h1 {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(90deg, #a855f7, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: clamp(1.1rem, 2.5vw, 1.4rem);
          color: #c7d2fe;
          margin-bottom: 1.5rem;
          max-width: 700px;
          font-weight: 500;
        }

        .description {
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: #9aa3b2;
          margin-bottom: 3rem;
          max-width: 600px;
          line-height: 1.6;
        }

        .cta-button {
          background: linear-gradient(90deg, #a855f7, #3b82f6);
          border: none;
          color: white;
          border-radius: 12px;
          padding: 1.1rem 2.5rem;
          font-weight: 600;
          cursor: pointer;
          font-size: 1.15rem;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
        }

        .cta-button:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(168, 85, 247, 0.4);
        }

        .cta-button:active {
          transform: translateY(0);
        }

        .gate-disclaimer {
          color: #6b7280;
          font-size: 0.9rem;
          margin-top: 2rem;
          max-width: 500px;
        }

        @media (max-width: 768px) {
          .gate-container {
            padding: 1.5rem 1rem;
          }

          .cta-button {
            padding: 1rem 2rem;
            font-size: 1rem;
            width: 100%;
            max-width: 350px;
          }
        }
      `}</style>
    </>
  );
}

