import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: `Invalid Token: ${authError?.message || 'No user'}` }), { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return new Response(JSON.stringify({ error: "Lu bukan bos! Hush sana!" }), { status: 403 });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Service Role Key belum dipasang di Vercel!" }), { status: 500 });
    }

    const { action, payload } = await req.json();

    if (action === 'get_stats') {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      return new Response(JSON.stringify({ users }), { status: 200 });
    }

    if (action === 'delete_user') {
      const { userId } = payload;
      // Jangan biarkan bos hapus dirinya sendiri
      if (userId === user.id) return new Response(JSON.stringify({ error: "Masa lu mau hapus diri sendiri bos?" }), { status: 400 });
      
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'broadcast') {
      const { message } = payload;
      const { error } = await supabaseAdmin.from('app_settings').upsert({ id: 'broadcast', value: message });
      if (error) {
         return new Response(JSON.stringify({ error: 'TABEL_BELUM_ADA', details: error.message }), { status: 400 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Unknown Action" }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET(req) {
   // API Public untuk mengambil pengumuman
   try {
      const { data, error } = await supabaseAdmin.from('app_settings').select('value').eq('id', 'broadcast').single();
      if (error || !data) return new Response(JSON.stringify({ message: '' }), { status: 200 });
      return new Response(JSON.stringify({ message: data.value }), { status: 200 });
   } catch (e) {
      return new Response(JSON.stringify({ message: '' }), { status: 200 });
   }
}
