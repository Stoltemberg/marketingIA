import fp from 'fastify-plugin';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

export default fp(async (fastify, opts) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  fastify.decorate('supabase', supabase);
});
