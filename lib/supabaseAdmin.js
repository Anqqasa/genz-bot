import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Klien ini punya akses "Dewa" yang bisa bypass RLS.
// DILARANG KERAS dipakai di Client-Side (Komponen React biasa).
// HANYA BOLEH dipakai di dalam folder /api/ (Server-Side).
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
