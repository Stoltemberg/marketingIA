import { createClient } from '@/utils/supabase/server';
import { Megaphone } from 'lucide-react';
import { AnimeStagger } from '@/components/ui/anime-stagger';

export default async function CampaignsPage() {
  const supabase = await createClient();
  
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(`
      *,
      project:projects(name),
      ad_sets(*)
    `)
    .order('created_at', { ascending: false });

  return (
    <AnimeStagger className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-zinc-100">All Campaigns</h1>
      </div>

      <div className="bg-zinc-950 border border-zinc-800/50 overflow-hidden sm:rounded-md text-zinc-100">
        <ul role="list" className="divide-y divide-zinc-800/50">
          {!campaigns || campaigns.length === 0 ? (
            <li className="px-6 py-10 text-center text-zinc-500 text-sm flex flex-col items-center">
              <Megaphone className="w-12 h-12 text-zinc-700 mb-4" />
              No campaigns published yet. Go to a project and generate an AI strategy to publish one.
            </li>
          ) : (
            campaigns.map((campaign) => (
              <li key={campaign.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-300 truncate">
                    {campaign.project?.name} - Campaign
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                      campaign.status === 'PAUSED' ? 'bg-amber-950/50 text-amber-400 border-amber-900/50' : 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'
                    }`}>
                      {campaign.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-zinc-500">
                      Meta ID: {campaign.meta_campaign_id}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-zinc-500 sm:mt-0">
                    <p>
                      Ad Sets: {campaign.ad_sets?.length || 0}
                    </p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </AnimeStagger>
  );
}
