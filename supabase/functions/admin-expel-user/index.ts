// Supabase Edge Function: admin-expel-user
// - Verifies caller is admin
// - Marks profile as expelled via DB RPC
// - Deletes auth user (or flags expelled) using Service Role
// - CORS enabled

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders } });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    // Get invoking user from the token
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const invokerId = userData.user.id;

    // Check admin role
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', invokerId);

    if (rolesErr) {
      return new Response(JSON.stringify({ error: rolesErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const isAdmin = (roles || []).some((r: any) => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Solo administradores' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await req.json().catch(() => ({}));
    const target_user_id = body?.target_user_id as string | undefined;
    const delete_auth: boolean = body?.delete_auth !== false; // default true

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'target_user_id requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 1) Update application data (profiles/status, cancel bookings, etc.)
    const { data: expelledProfile, error: rpcErr } = await supabaseAdmin.rpc('admin_expel_user', {
      target_user_id,
    });

    if (rpcErr) {
      return new Response(JSON.stringify({ error: rpcErr.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 2) Delete or flag auth user
    let authAction: 'deleted' | 'flagged' | 'skipped' = 'skipped';

    if (delete_auth) {
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
      if (delErr) {
        // If deletion fails, attempt to flag instead
        const { error: flagErr } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
          app_metadata: { expelled: true },
        } as any);
        if (flagErr) {
          return new Response(JSON.stringify({ error: `No se pudo eliminar ni marcar al usuario: ${delErr.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        authAction = 'flagged';
      } else {
        authAction = 'deleted';
      }
    } else {
      const { error: flagErr } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
        app_metadata: { expelled: true },
      } as any);
      if (flagErr) {
        return new Response(JSON.stringify({ error: flagErr.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      authAction = 'flagged';
    }

    return new Response(
      JSON.stringify({ success: true, profile: expelledProfile, auth_action: authAction }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Error inesperado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

Deno.serve(handler);
