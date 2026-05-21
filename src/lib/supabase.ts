import { createClient } from "@supabase/supabase-js";

// import.meta.env may not be recognized by TypeScript's ImportMeta type in some configs
// cast to any to access VITE variables safely
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL ?? "";
const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseKey);
