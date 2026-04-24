import { FastifyPluginAsync } from 'fastify';
import axios from 'axios';

const metaRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const META_API_VERSION = 'v19.0';
  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

  const authenticate = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await fastify.supabase.auth.getUser(token);
    
    if (error || !user) {
      return reply.status(401).send({ error: 'Invalid token' });
    }
    request.user = user;
  };

  const callMetaApi = async (path: string, payload: any, type: string) => {
    if (!META_ACCESS_TOKEN || META_ACCESS_TOKEN === 'YOUR_META_ACCESS_TOKEN') {
      return { id: `mock_${type}_${Date.now()}` };
    }
    const url = `https://graph.facebook.com/${META_API_VERSION}/${META_AD_ACCOUNT_ID}/${path}`;
    const response = await axios.post(url, {
      ...payload,
      access_token: META_ACCESS_TOKEN
    });
    return response.data;
  };

  fastify.post('/create-campaign', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { project_id, name, objective } = request.body;

    try {
      const metaCampaign = await callMetaApi('campaigns', {
        name,
        objective: objective || 'OUTCOME_SALES',
        status: 'PAUSED', // Rule: create everything as PAUSED
        special_ad_categories: []
      }, 'campaign');

      const { data, error } = await fastify.supabase
        .from('campaigns')
        .insert([{
          project_id,
          meta_campaign_id: metaCampaign.id,
          status: 'PAUSED'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to create campaign', details: err.message });
    }
  });

  fastify.post('/create-adset', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { campaign_id, name, daily_budget, target_audience } = request.body;

    try {
      const { data: campaign } = await fastify.supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaign_id)
        .single();

      if (!campaign) throw new Error('Campaign not found');

      const metaAdSet = await callMetaApi('adsets', {
        name,
        campaign_id: campaign.meta_campaign_id,
        daily_budget: daily_budget * 100, // cents
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'REACH',
        bid_amount: 100,
        status: 'PAUSED'
      }, 'adset');

      const { data, error } = await fastify.supabase
        .from('ad_sets')
        .insert([{
          campaign_id,
          meta_adset_id: metaAdSet.id,
          budget: daily_budget,
          audience: target_audience,
          status: 'PAUSED'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to create adset', details: err.message });
    }
  });

  fastify.post('/create-ad', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { ad_set_id, name, creative_url, copy, headline } = request.body;

    try {
       const { data: adset } = await fastify.supabase
        .from('ad_sets')
        .select('*')
        .eq('id', ad_set_id)
        .single();

      if (!adset) throw new Error('AdSet not found');

      const metaAd = await callMetaApi('ads', {
        name,
        adset_id: adset.meta_adset_id,
        creative: { object_story_spec: { page_id: 'mock_page_id', link_data: { message: copy, link: creative_url, name: headline } } },
        status: 'PAUSED'
      }, 'ad');

      const { data, error } = await fastify.supabase
        .from('ads')
        .insert([{
          ad_set_id,
          meta_ad_id: metaAd.id,
          copy,
          headline,
          creative_url,
          status: 'PAUSED'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to create ad', details: err.message });
    }
  });
};

export default metaRoutes;
