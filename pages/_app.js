// pages/_app.js
import "../styles/article.css";
import "../styles/archive.css";

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
