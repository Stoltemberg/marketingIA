import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Plus, Folder } from 'lucide-react';
import { AnimeStagger } from '@/components/ui/anime-stagger';

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default async function ProjectsPage() {
  const supabase = await createClient();
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AnimeStagger className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-zinc-100">Projects</h1>
        <Link 
          href="/projects/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-zinc-100 hover:bg-white transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Link>
      </div>

      <div className="bg-zinc-950 border border-zinc-800/50 overflow-hidden sm:rounded-md text-zinc-100">
        <ul role="list" className="divide-y divide-zinc-800/50">
          {!projects || projects.length === 0 ? (
            <li className="px-6 py-10 text-center text-zinc-500 text-sm flex flex-col items-center">
              <Folder className="w-12 h-12 text-zinc-700 mb-4" />
              No projects found. Create your first project to get started.
            </li>
          ) : (
            projects.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`} className="block hover:bg-zinc-900 transition-colors">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-300 truncate">{project.name}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                          project.status === 'active' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}>
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
                      <div className="mt-2 flex items-center text-sm text-zinc-500 sm:mt-0">
                        <p>
                          Budget: {brlFormatter.format(project.daily_budget)}/dia
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
    </AnimeStagger>
  );
}
