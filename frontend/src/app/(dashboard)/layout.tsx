import { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, FolderKanban, Megaphone, LogOut } from 'lucide-react';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-100">Marketing AI</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="group flex items-center px-4 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded-md transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            Dashboard
          </Link>
          <Link href="/projects" className="group flex items-center px-4 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded-md transition-colors">
            <FolderKanban className="w-5 h-5 mr-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            Projects
          </Link>
          <Link href="/campaigns" className="group flex items-center px-4 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded-md transition-colors">
            <Megaphone className="w-5 h-5 mr-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            Campaigns
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center text-sm text-zinc-400 mb-4 truncate">
            {user.email}
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-950/50 rounded-md transition-colors">
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-black p-8 text-zinc-100">
          {children}
        </main>
      </div>
    </div>
  );
}
