'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, Megaphone } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  url: string;
  target_audience: string;
  daily_budget: number;
};

type RecommendationAudience = {
  name: string;
  description: string;
  interests: string[];
};

type RecommendationPayload = {
  angles?: string[];
  audiences?: RecommendationAudience[];
  copies?: string[];
  headlines?: string[];
};

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (error) throw error;
        if (!cancelled) {
          setProject(data);
        }

        const { data: recData } = await supabase
          .from('ai_recommendations')
          .select('*')
          .eq('project_id', resolvedParams.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!cancelled && recData) {
          setRecommendations(recData.recommendation as RecommendationPayload);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [resolvedParams.id, supabase]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ project_id: resolvedParams.id })
      });

      if (!response.ok) throw new Error("Failed to generate");
      const result = await response.json();
      setRecommendations(result);
    } catch (error) {
      console.error(error);
      alert('Error generating campaign strategy. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (
      !project ||
      !recommendations?.audiences?.[0] ||
      !recommendations.copies?.[0] ||
      !recommendations.headlines?.[0]
    ) {
      alert('Generate a complete strategy before publishing.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create Campaign
      const campRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/create-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ project_id: resolvedParams.id, name: `${project.name} - AI Gen`, objective: 'OUTCOME_SALES' })
      });
      const campData = await campRes.json();

      // Create AdSet
      const adsetRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/create-adset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ campaign_id: campData.id, name: 'Broad Audience', daily_budget: project.daily_budget, target_audience: recommendations.audiences[0] })
      });
      const adsetData = await adsetRes.json();

      // Create Ad
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/create-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ad_set_id: adsetData.id, name: 'AI Ad 1', creative_url: project.url, copy: recommendations.copies[0], headline: recommendations.headlines[0] })
      });

      alert('Campaign successfully published to Meta in PAUSED status!');
    } catch (error) {
      console.error(error);
      alert('Error publishing to Meta');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="max-w-4xl mx-auto text-black">
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{project.name}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{project.url}</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? 'Generating AI Strategy...' : 'Generate Strategy'}
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Target Audience</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.target_audience}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Daily Budget</dt>
              <dd className="mt-1 text-sm text-gray-900">${project.daily_budget}</dd>
            </div>
          </dl>
        </div>
      </div>

      {recommendations && (
        <div className="bg-white shadow sm:rounded-lg border border-purple-100">
          <div className="px-4 py-5 sm:px-6 bg-purple-50 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-purple-900">AI Campaign Recommendations</h3>
              <p className="mt-1 max-w-2xl text-sm text-purple-700">Ready to publish to Meta Ads</p>
            </div>
            <button
              onClick={handlePublish}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Publish Campaign
            </button>
          </div>
          <div className="border-t border-purple-100 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Suggested Headlines</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="list-disc pl-5 space-y-1">
                    {recommendations.headlines?.map((h: string, i: number) => <li key={i}>{h}</li>)}
                  </ul>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Suggested Copies</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.copies?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  </ul>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Target Audiences</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="space-y-3">
                    {recommendations.audiences?.map((a: RecommendationAudience, i: number) => (
                      <li key={i} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <span className="font-semibold block">{a.name}</span>
                        <span className="text-gray-600 block text-xs mt-1">{a.description}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
