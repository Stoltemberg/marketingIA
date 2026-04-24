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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Marketing AI</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
            <LayoutDashboard className="w-5 h-5 mr-3 text-gray-400" />
            Dashboard
          </Link>
          <Link href="/projects" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
            <FolderKanban className="w-5 h-5 mr-3 text-gray-400" />
            Projects
          </Link>
          <Link href="/campaigns" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
            <Megaphone className="w-5 h-5 mr-3 text-gray-400" />
            Campaigns
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-500 mb-4 truncate">
            {user.email}
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8 text-black">
          {children}
        </main>
      </div>
    </div>
  );
}
