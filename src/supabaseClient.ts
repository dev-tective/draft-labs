import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseCloudUrl = import.meta.env.VITE_SUPABASE_CLOUD_URL;
const supabaseCloudAnonKey = import.meta.env.VITE_SUPABASE_CLOUD_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseCloud = createClient(supabaseCloudUrl, supabaseCloudAnonKey);