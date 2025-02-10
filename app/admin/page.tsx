export default function AdminPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Panel de Administración
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Configuración de Prompts
            </p>
            <p className="text-2xl font-bold">1 activa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
