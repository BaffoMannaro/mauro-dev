import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      <TopNav session={session} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
