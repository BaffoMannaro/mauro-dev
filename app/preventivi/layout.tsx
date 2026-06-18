import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <Sidebar session={session} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
