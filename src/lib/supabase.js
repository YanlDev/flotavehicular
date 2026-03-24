import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase para Client Components ('use client').
 * No importa next/headers — seguro en el navegador.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
