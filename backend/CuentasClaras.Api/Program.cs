using CuentasClaras.Core.Entities;
using CuentasClaras.Infra;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Ruta de la base SQLite. En un host con disco (Render con disco persistente) se apunta
// DB_PATH a /data/cuentasclaras.db para que los grupos no se pierdan en cada deploy.
// Sin disco, cualquier ruta (incluida esta) se borra al redesplegar.
var dbPath = builder.Configuration["DB_PATH"] ?? "cuentasclaras.db";

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<CuentasClarasDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}",
        sqlite => sqlite.MigrationsAssembly("CuentasClaras.Infra")));

// Orígenes permitidos: configurables con la variable Cors__Origins (separados por coma)
var origins = (builder.Configuration["Cors:Origins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Concat(["http://localhost:5173", "https://localhost", "capacitor://localhost"])
    .Distinct()
    .ToArray();

builder.Services.AddCors(o => o.AddPolicy("front", p =>
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CuentasClarasDbContext>();
    db.Database.Migrate();

    // Si la base está vacía, carga un grupo de ejemplo (código: demo)
    if (!db.Grupos.Any())
    {
        var agustin = new Miembro { Nombre = "Agustín" };
        var esteban = new Miembro { Nombre = "Esteban" };
        var charly = new Miembro { Nombre = "Charly" };
        var todos = new List<Miembro> { agustin, esteban, charly };

        var grupo = new Grupo
        {
            Nombre = "Asado del sábado",
            CodigoInvitacion = "demo",
            Miembros = todos
        };

        grupo.Gastos.Add(new GastoRegistrado { Descripcion = "Carne", Monto = 42000m, PagadoPor = agustin, Participantes = todos.ToList() });
        grupo.Gastos.Add(new GastoRegistrado { Descripcion = "Bebidas", Monto = 18000m, PagadoPor = esteban, Participantes = todos.ToList() });
        grupo.Gastos.Add(new GastoRegistrado { Descripcion = "Hielo y carbón", Monto = 6000m, PagadoPor = charly, Participantes = todos.ToList() });

        db.Grupos.Add(grupo);
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("front");

app.MapGet("/", () => "Cuentas Claras API");
app.MapControllers();

app.Run();