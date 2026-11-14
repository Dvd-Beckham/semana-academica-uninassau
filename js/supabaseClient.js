// /js/supabaseClient.js
const SUPABASE_URL = 'https://wtksmkjydoioxmtxgbpx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rU5D8t8_SDLsD_a1Ib4g6w_qr1BXzLR';

// Inicializa o cliente global do Supabase (carregado via CDN no HTML)
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);