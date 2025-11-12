import { createClient } from "@supabase/supabase-js";

// --- ENCONTRE ISSO NO SEU PAINEL SUPABASE ---
const SUPABASE_URL = "https://wqojzvqbgkfkpabakqor.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Wn8naAqraUukiHaSlMfRWg_36jQ5w6S";
// ------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
