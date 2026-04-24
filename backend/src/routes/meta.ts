import { FastifyPluginAsync } from 'fastify';
import axios from 'axios';

const metaRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const META_API_VERSION = 'v19.0';
  const META_MIN_DAILY_BUDGET = 5.02;
  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
  const META_PAGE_ID = process.env.META_PAGE_ID;

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
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `https://graph.facebook.com/${META_API_VERSION}/${normalizedPath}`;
    const response = await axios.post(url, {
      ...payload,
      access_token: META_ACCESS_TOKEN
    });
    return response.data;
  };

  const getMeta = async (path: string, params: Record<string, unknown> = {}) => {
    if (!META_ACCESS_TOKEN || META_ACCESS_TOKEN === 'YOUR_META_ACCESS_TOKEN') {
      throw new Error('META_ACCESS_TOKEN is required');
    }

    const url = `https://graph.facebook.com/${META_API_VERSION}/${path}`;
    const response = await axios.get(url, {
      params: {
        ...params,
        access_token: META_ACCESS_TOKEN,
      },
    });

    return response.data;
  };

  const getErrorDetails = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      return err.response?.data || err.message;
    }

    if (err instanceof Error) {
      return err.message;
    }

    return 'Unknown error';
  };

  const logMetaError = (action: string, err: unknown, context: Record<string, unknown> = {}) => {
    fastify.log.error(
      {
        action,
        context,
        details: getErrorDetails(err),
      },
      `Meta API ${action} failed`
    );
  };

  fastify.post('/create-campaign', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { project_id, name, objective } = request.body;

    try {
      const metaCampaign = await callMetaApi('campaigns', {
        name,
        objective: objective || 'OUTCOME_SALES',
        buying_type: 'AUCTION',
        is_adset_budget_sharing_enabled: false,
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
    } catch (err: unknown) {
      logMetaError('create-campaign', err, {
        project_id,
        name,
        objective: objective || 'OUTCOME_SALES',
        ad_account_id: META_AD_ACCOUNT_ID,
      });
      return reply.status(500).send({ error: 'Failed to create campaign', details: getErrorDetails(err) });
    }
  });

  fastify.get('/diagnostics', { preValidation: [authenticate] }, async (_request, reply) => {
    try {
      const [me, adAccounts, pages, configuredAdAccount, configuredPage] = await Promise.allSettled([
        getMeta('me', { fields: 'id,name' }),
        getMeta('me/adaccounts', { fields: 'id,account_id,name,account_status,currency' }),
        getMeta('me/accounts', { fields: 'id,name,category,access_token' }),
        META_AD_ACCOUNT_ID
          ? getMeta(META_AD_ACCOUNT_ID, { fields: 'id,account_id,name,account_status,currency' })
          : Promise.resolve(null),
        META_PAGE_ID
          ? getMeta(META_PAGE_ID, { fields: 'id,name,link,category' })
          : Promise.resolve(null),
      ]);

      return reply.send({
        configured: {
          ad_account_id: META_AD_ACCOUNT_ID || null,
          page_id: META_PAGE_ID || null,
        },
        me: me.status === 'fulfilled' ? me.value : { error: getErrorDetails(me.reason) },
        visible_ad_accounts:
          adAccounts.status === 'fulfilled' ? adAccounts.value : { error: getErrorDetails(adAccounts.reason) },
        visible_pages:
          pages.status === 'fulfilled'
            ? {
                data: Array.isArray(pages.value?.data)
                  ? pages.value.data.map((page: Record<string, unknown>) => ({
                      id: page.id,
                      name: page.name,
                      category: page.category,
                    }))
                  : pages.value,
              }
            : { error: getErrorDetails(pages.reason) },
        configured_ad_account_lookup:
          configuredAdAccount.status === 'fulfilled'
            ? configuredAdAccount.value
            : { error: getErrorDetails(configuredAdAccount.reason) },
        configured_page_lookup:
          configuredPage.status === 'fulfilled'
            ? configuredPage.value
            : { error: getErrorDetails(configuredPage.reason) },
      });
    } catch (err: unknown) {
      logMetaError('diagnostics', err, {
        ad_account_id: META_AD_ACCOUNT_ID,
        page_id: META_PAGE_ID,
      });
      return reply.status(500).send({
        error: 'Failed to run Meta diagnostics',
        details: getErrorDetails(err),
      });
    }
  });

  fastify.post('/create-adset', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { campaign_id, name, daily_budget, target_audience } = request.body;

    try {
      const normalizedBudget = Number(daily_budget);
      if (!Number.isFinite(normalizedBudget) || normalizedBudget < META_MIN_DAILY_BUDGET) {
        throw new Error(`O orçamento minimo para esta conta Meta e R$ ${META_MIN_DAILY_BUDGET.toFixed(2)} por dia.`);
      }

      const { data: campaign } = await fastify.supabase
        .from('campaigns')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('id', campaign_id)
        .single();

      if (!campaign) throw new Error('Campaign not found');

      const country = campaign.project?.country?.trim()?.toUpperCase();
      const targeting: Record<string, unknown> = {
        geo_locations: {
          countries: country ? [country] : ['BR']
        }
      };

      if (Array.isArray(target_audience?.interests) && target_audience.interests.length > 0) {
        targeting.flexible_spec = [
          {
            interests: target_audience.interests.map((interest: string) => ({ name: interest }))
          }
        ];
      }

      const metaAdSet = await callMetaApi('adsets', {
        name,
        campaign_id: campaign.meta_campaign_id,
        daily_budget: Math.round(normalizedBudget * 100), // cents
        is_adset_budget_sharing_enabled: false,
        targeting,
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
    } catch (err: unknown) {
      logMetaError('create-adset', err, {
        campaign_id,
        name,
        daily_budget,
        ad_account_id: META_AD_ACCOUNT_ID,
      });
      return reply.status(500).send({ error: 'Failed to create adset', details: getErrorDetails(err) });
    }
  });

  fastify.post('/create-ad', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { ad_set_id, name, creative_url, copy, headline } = request.body;

    try {
      if (!META_PAGE_ID || META_PAGE_ID === 'YOUR_META_PAGE_ID') {
        throw new Error('META_PAGE_ID is required to create ads');
      }

       const { data: adset } = await fastify.supabase
        .from('ad_sets')
        .select('*')
        .eq('id', ad_set_id)
        .single();

      if (!adset) throw new Error('AdSet not found');

      const creative = await callMetaApi(`${META_AD_ACCOUNT_ID}/adcreatives`, {
        name: `${name} Creative`,
        object_story_spec: {
          page_id: META_PAGE_ID,
          link_data: {
            message: copy,
            link: creative_url,
            name: headline
          }
        }
      }, 'adcreative');

      const metaAd = await callMetaApi(`${META_AD_ACCOUNT_ID}/ads`, {
        name,
        adset_id: adset.meta_adset_id,
        creative: {
          creative_id: creative.id
        },
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
    } catch (err: unknown) {
      logMetaError('create-ad', err, {
        ad_set_id,
        name,
        page_id: META_PAGE_ID,
        ad_account_id: META_AD_ACCOUNT_ID,
      });
      return reply.status(500).send({ error: 'Failed to create ad', details: getErrorDetails(err) });
    }
  });
};

export default metaRoutes;
