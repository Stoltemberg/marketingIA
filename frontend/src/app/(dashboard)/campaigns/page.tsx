import { createClient } from '@/utils/supabase/server';
import { Megaphone } from 'lucide-react';

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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">All Campaigns</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md text-black">
        <ul role="list" className="divide-y divide-gray-200">
          {!campaigns || campaigns.length === 0 ? (
            <li className="px-6 py-10 text-center text-gray-500 text-sm flex flex-col items-center">
              <Megaphone className="w-12 h-12 text-gray-300 mb-4" />
              No campaigns published yet. Go to a project and generate an AI strategy to publish one.
            </li>
          ) : (
            campaigns.map((campaign) => (
              <li key={campaign.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-600 truncate">
                    {campaign.project?.name} - Campaign
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {campaign.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Meta ID: {campaign.meta_campaign_id}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
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
    </div>
  );
}
