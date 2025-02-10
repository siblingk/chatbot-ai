import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - Siblignk',
  description: 'Panel de administración de Siblignk',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold">Siblignk Admin</span>
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
            <div className="relative overflow-hidden py-6 pr-6 lg:py-8">
              <div className="space-y-4">
                <div className="px-2">
                  <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                    Configuración
                  </h2>
                  <div className="space-y-1">
                    <a
                      href="/admin/prompts"
                      className="flex w-full items-center rounded-lg p-2 hover:bg-accent hover:text-accent-foreground"
                    >
                      Configuración de Prompts
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
