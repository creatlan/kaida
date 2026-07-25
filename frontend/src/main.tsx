
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
import { supabase } from "./lib/supabase";

console.log("TEST START");
  createRoot(document.getElementById("root")!).render(<App />);
  
  async function testSupabase() {
  const { data, error } = await supabase
    .from("questions")
    .select("*");

  console.log("SUPABASE DATA:", data);
  console.log("SUPABASE ERROR:", error);
}

testSupabase();