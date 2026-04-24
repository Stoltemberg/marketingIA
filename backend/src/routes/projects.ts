import { FastifyPluginAsync } from 'fastify';

const projectRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const authenticate = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await fastify.supabase.auth.getUser(token);
    
    if (error || !user) {
      reply.status(401).send({ error: 'Invalid token' });
      return;
    }
    request.user = user;
  };

  fastify.get('/', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { data, error } = await fastify.supabase
      .from('projects')
      .select('*')
      .eq('user_id', request.user.id)
      .order('created_at', { ascending: false });
    
    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  fastify.post('/', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { name, url, target_audience, country, daily_budget, conversion_goal, brand_voice } = request.body;
    
    const { data, error } = await fastify.supabase
      .from('projects')
      .insert([
        { 
          user_id: request.user.id, 
          name, 
          url, 
          target_audience, 
          country, 
          daily_budget, 
          conversion_goal, 
          brand_voice 
        }
      ])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  fastify.get('/:id', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { id } = request.params;
    const { data, error } = await fastify.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', request.user.id)
      .single();

    if (error) return reply.status(404).send({ error: 'Project not found' });
    return data;
  });
};

export default projectRoutes;
