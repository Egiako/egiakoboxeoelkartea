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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Admin client with service role key
    console.log('Initializing Supabase admin client...');
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      },
    });

    // Extract and verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Authorization header requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Verifying JWT token...');

    // Verify the calling user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr) {
      console.error('Error verifying user:', userErr);
      return new Response(JSON.stringify({ error: 'Token inválido', details: userErr.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!userData?.user) {
      console.error('No user data found');
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const invokerId = userData.user.id;
    console.log('User verified:', invokerId);

    // Check admin role
    console.log('Checking admin role for user:', invokerId);
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', invokerId);

    if (rolesErr) {
      console.error('Error checking roles:', rolesErr);
      return new Response(JSON.stringify({ error: 'Error verificando roles', details: rolesErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const isAdmin = (roles || []).some((r: any) => r.role === 'admin');
    console.log('User is admin:', isAdmin);
    
    if (!isAdmin) {
      console.error('User is not admin');
      return new Response(JSON.stringify({ error: 'Solo administradores pueden expulsar usuarios' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error('Error parsing request body:', parseErr);
      return new Response(JSON.stringify({ error: 'Cuerpo de solicitud inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const target_user_id = body?.target_user_id as string | undefined;
    const delete_auth: boolean = body?.delete_auth !== false; // default true

    if (!target_user_id) {
      console.error('Missing target_user_id');
      return new Response(JSON.stringify({ error: 'target_user_id es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Expelling user:', target_user_id, 'delete_auth:', delete_auth);

    // Step 1: Update profile and cancel bookings via RPC
    console.log('Calling admin_expel_user RPC...');
    const { data: expelledProfile, error: rpcErr } = await supabaseAdmin.rpc('admin_expel_user', {
      target_user_id,
    });

    if (rpcErr) {
      console.error('RPC error:', rpcErr);
      return new Response(JSON.stringify({ error: 'Error al expulsar usuario', details: rpcErr.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Profile updated successfully');

    // Step 2: Handle auth user deletion or flagging
    let authAction: 'deleted' | 'flagged' | 'skipped' = 'skipped';

    // Helper to rename email and flag as expelled
    const renameAndFlag = async () => {
      console.log('Renaming and flagging user email...');
      const { data: targetUserData, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(target_user_id);
      
      if (getUserErr) {
        console.error('Error getting target user:', getUserErr);
        throw new Error(`No se pudo obtener el usuario: ${getUserErr.message}`);
      }

      const currentEmail = targetUserData?.user?.email || '';
      const ts = Date.now();
      let newEmail = `expelled-${ts}@invalid.local`;
      
      if (currentEmail.includes('@')) {
        const [local, domain] = currentEmail.split('@');
        newEmail = `${local}+expelled-${ts}@${domain}`;
      }

      console.log('Updating user email to:', newEmail);
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
        email: newEmail,
        app_metadata: { expelled: true, expelled_at: new Date().toISOString() },
      });

      if (updErr) {
        console.error('Error updating user:', updErr);
        throw new Error(`No se pudo actualizar el usuario: ${updErr.message}`);
      }

      console.log('User email renamed successfully');
    };

    if (delete_auth) {
      console.log('Attempting to delete auth user...');
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
      
      if (delErr) {
        console.error('Delete user error:', delErr, '- attempting to rename instead');
        // If deletion fails, rename email and flag to free the original email
        try {
          await renameAndFlag();
          authAction = 'flagged';
        } catch (e: any) {
          console.error('Failed to rename after delete failure:', e);
          return new Response(JSON.stringify({ 
            error: 'No se pudo eliminar ni renombrar al usuario', 
            details: `Delete error: ${delErr.message}, Rename error: ${e.message}` 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      } else {
        console.log('Auth user deleted successfully');
        authAction = 'deleted';
      }
    } else {
      // Keep auth record but rename email and flag
      console.log('Keeping auth record, renaming email...');
      try {
        await renameAndFlag();
        authAction = 'flagged';
      } catch (flagErr: any) {
        console.error('Failed to rename user:', flagErr);
        return new Response(JSON.stringify({ 
          error: 'Error al marcar usuario como expulsado', 
          details: flagErr.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    console.log('User expelled successfully, auth action:', authAction);
    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: expelledProfile, 
        auth_action: authAction,
        message: 'Usuario expulsado exitosamente'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );

  } catch (e: any) {
    console.error('Unexpected error in admin-expel-user:', e);
    return new Response(JSON.stringify({ 
      error: 'Error inesperado al expulsar usuario',
      details: e?.message || 'Sin detalles',
      stack: e?.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

Deno.serve(handler);
