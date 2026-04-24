'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const META_ACCOUNT_CURRENCY = 'BRL';

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    target_audience: '',
    country: '',
    daily_budget: '',
    conversion_goal: 'sales',
    brand_voice: 'professional'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to create project");
      
      const newProject = await response.json();
      router.push(`/projects/${newProject.id}`);
    } catch (error) {
      console.error(error);
      alert('Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Project</h1>
      
      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 px-4 py-5 sm:p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Website URL</label>
            <input type="url" required value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Target Audience</label>
            <textarea required value={formData.target_audience} onChange={e => setFormData({...formData, target_audience: e.target.value})} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" placeholder="E.g., Small business owners aged 25-45..."></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input type="text" required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" placeholder="US, BR, etc." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Daily Budget ({META_ACCOUNT_CURRENCY})</label>
              <input type="number" min="5.02" step="0.01" required value={formData.daily_budget} onChange={e => setFormData({...formData, daily_budget: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" />
              <p className="mt-1 text-xs text-gray-500">Meta account minimum: R$ 5,02 por dia.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
