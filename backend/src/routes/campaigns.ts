import { FastifyPluginAsync } from 'fastify';
import OpenAI from 'openai';

const campaignRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Use OpenAI SDK but configured for OpenRouter
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'Marketing AI App',
    }
  });

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

  fastify.post('/generate', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { project_id } = request.body;

    if (!project_id) {
      return reply.status(400).send({ error: 'Missing project_id' });
    }

    const { data: project, error } = await fastify.supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', request.user.id)
      .single();

    if (error || !project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    try {
      const prompt = `
      You are an expert performance marketing AI. Create a Meta Ads campaign strategy for the following product:
      Name: ${project.name}
      URL: ${project.url}
      Target Audience: ${project.target_audience}
      Country: ${project.country}
      Goal: ${project.conversion_goal}
      Brand Voice: ${project.brand_voice}

      Generate a JSON response with exactly this structure:
      {
        "angles": ["angle 1", "angle 2", "angle 3"],
        "audiences": [
          { "name": "Audience 1", "description": "Desc 1", "interests": ["interest 1", "interest 2"] },
          { "name": "Audience 2", "description": "Desc 2", "interests": ["interest 3", "interest 4"] },
          { "name": "Audience 3", "description": "Desc 3", "interests": ["interest 5", "interest 6"] }
        ],
        "copies": ["copy 1", "copy 2", "copy 3", "copy 4", "copy 5"],
        "headlines": ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"]
      }
      Respond ONLY with valid JSON. Do not include markdown formatting or backticks around the JSON.
      `;

      if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY') {
        const mockResponse = {
          angles: ['Discount Focus', 'Problem/Solution', 'Social Proof'],
          audiences: [
            { name: 'Broad', description: 'Broad targeting in country', interests: [] },
            { name: 'Competitors', description: 'People interested in competitors', interests: ['Competitor A'] },
            { name: 'Lookalike', description: '1% Lookalike of buyers', interests: [] }
          ],
          copies: ['Get the best product today!', 'Solve your problem with our product.', 'Join 10,000+ happy customers.', 'Limited time offer!', 'The ultimate solution for you.'],
          headlines: ['Buy Now', 'Learn More', 'Special Offer', 'Don\'t Miss Out', 'Get Yours Today']
        };

        await fastify.supabase.from('ai_recommendations').insert([{
          project_id: project.id,
          recommendation: mockResponse,
          status: 'completed'
        }]);

        return mockResponse;
      }

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openrouter/free',
        response_format: { type: 'json_object' }
      });

      // Handle potential markdown formatting from openrouter/free models which might not perfectly respect json_object
      let content = completion.choices[0].message.content || '{}';
      content = content.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      
      const suggestions = JSON.parse(content);

      await fastify.supabase.from('ai_recommendations').insert([{
        project_id: project.id,
        recommendation: suggestions,
        status: 'completed'
      }]);

      return suggestions;

    } catch (err: any) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to generate campaign', details: err.message });
    }
  });
};

export default campaignRoutes;
