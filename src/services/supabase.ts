import {createClient} from "@supabase/supabase-js";


const supabaseUrl = "https://geicwuyoppnwjzzbdwyb.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey): undefined;
