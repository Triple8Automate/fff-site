import { useState } from "react";

export default function ArticlesGate() {
  const [email, setEmail] = useState("");
  const [granted, setGranted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes("@")) return alert("Please enter a valid email.");
    localStorage.setItem("fffEmail", email);
    setGranted(true);
  }

  if (!granted && !localStorage.getItem("fffEmail")) {
    return (
      <main style={{
        display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",minHeight:"100vh",padding:"2rem",
        background:"#000",color:"#fff",textAlign:"center"
      }}>
        <h1>Access the Forbidden Archive</h1>
        <p style={{maxWidth:400,opacity:.8}}>
          1,200+ peer-reviewed studies distilled into the raw truth of human performance.
          Enter your email to unlock the research.
        </p>
        <form onSubmit={handleSubmit} style={{marginTop:"1.5rem"}}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            style={{
              padding:"0.8rem 1rem",borderRadius:6,border:"none",
              width:250,marginRight:8
            }}
          />
          <button type="submit" style={{
            background:"linear-gradient(90deg,#a855f7,#3b82f6)",
            border:"none",padding:"0.8rem 1.2rem",borderRadius:6,
            color:"#fff",cursor:"pointer"
          }}>
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{minHeight:"100vh",padding:"3rem",color:"#fff",background:"#0b0b0f"}}>
      <h1>Research Archive</h1>
      <p>Welcome, {localStorage.getItem("fffEmail") || email}.</p>
      <p>The full index of articles will load here soon.</p>
    </main>
  );
}
