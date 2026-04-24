import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AnimeStagger } from '@/components/ui/anime-stagger';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <AnimeStagger className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
        <Link 
          href="/projects/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-zinc-100 hover:bg-white transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Stats Cards */}
        <div className="bg-zinc-950 overflow-hidden border border-zinc-800/50 rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-zinc-400 truncate">Total Projects</dt>
            <dd className="mt-1 text-3xl font-semibold text-zinc-100">{projects?.length || 0}</dd>
          </div>
        </div>
        <div className="bg-zinc-950 overflow-hidden border border-zinc-800/50 rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-zinc-400 truncate">Active Campaigns</dt>
            <dd className="mt-1 text-3xl font-semibold text-zinc-100">0</dd>
          </div>
        </div>
        <div className="bg-zinc-950 overflow-hidden border border-zinc-800/50 rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-zinc-400 truncate">Total Spend</dt>
            <dd className="mt-1 text-3xl font-semibold text-zinc-100">$0.00</dd>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-zinc-100 mb-4">Recent Projects</h2>
        <div className="bg-zinc-950 border border-zinc-800/50 overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-zinc-800/50">
            {projects?.length === 0 ? (
              <li className="px-6 py-4 text-center text-zinc-500 text-sm">
                No projects yet. Create one to get started.
              </li>
            ) : (
              projects?.map((project) => (
                <li key={project.id}>
                  <Link href={`/projects/${project.id}`} className="block hover:bg-zinc-900 transition-colors">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-zinc-300 truncate">{project.name}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/50">
                            {project.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-zinc-500">
                            {project.url}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </AnimeStagger>
  );
}
