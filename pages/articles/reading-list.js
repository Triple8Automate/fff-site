// pages/articles/reading-list.js
import { useEffect, useState } from "react";

export async function getServerSideProps() {
  return { props: {} };
}

export default function ReadingList(){
  const [items, setItems] = useState([]);
  useEffect(()=>{ try{ setItems(JSON.parse(localStorage.getItem("fff_reading_list_v1")||"[]")); }catch{} },[]);
  return (
    <main className="article-wrap">
      <a href="/articles" className="breadcrumb">← Back to archive</a>
      <h1>Reading list</h1>
      {items.length===0 ? <div className="small">Nothing saved yet.</div> :
        <ul style={{paddingLeft:0, listStyle:"none"}}>
          {items.map(x=>(
            <li key={x.id} style={{margin:".35rem 0"}}>
              <a href={`/articles/${x.id}`} style={{textDecoration:"underline", color:"#a5b4fc"}}>{x.title}</a>
              <span className="small"> {x.date ? `— ${x.date}`:""} {x.cluster?`· ${x.cluster}`:""}</span>
            </li>
          ))}
        </ul>
      }
    </main>
  );
}
