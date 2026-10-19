using CuentasClaras.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace CuentasClaras.Infra;

public class CuentasClarasDbContext(DbContextOptions<CuentasClarasDbContext> options) : DbContext(options)
{
    public DbSet<Grupo> Grupos => Set<Grupo>();
    public DbSet<Miembro> Miembros => Set<Miembro>();
    public DbSet<GastoRegistrado> Gastos => Set<GastoRegistrado>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Grupo>(g =>
        {
            g.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
            g.HasIndex(x => x.CodigoInvitacion).IsUnique();
        });

        modelBuilder.Entity<Miembro>(m =>
        {
            m.Property(x => x.Nombre).HasMaxLength(60).IsRequired();
            m.HasOne(x => x.Grupo).WithMany(g => g.Miembros).HasForeignKey(x => x.GrupoId);
        });

        modelBuilder.Entity<GastoRegistrado>(g =>
        {
            g.Property(x => x.Descripcion).HasMaxLength(200).IsRequired();
            g.Property(x => x.Monto).HasPrecision(18, 2);

            g.HasOne(x => x.Grupo).WithMany(x => x.Gastos).HasForeignKey(x => x.GrupoId);

            // Evita borrado en cascada múltiple sobre Miembro
            g.HasOne(x => x.PagadoPor).WithMany().HasForeignKey(x => x.PagadoPorId)
             .OnDelete(DeleteBehavior.Restrict);

            g.HasMany(x => x.Participantes).WithMany();
        });

        modelBuilder.Entity<DetalleReparto>(d =>
        {
            d.Property(x => x.Monto).HasPrecision(18, 2);
            d.HasIndex(x => new { x.GastoId, x.MiembroId }).IsUnique();

            // Borrar el gasto se lleva su reparto puesto; los miembros no se borran desde la API
            d.HasOne(x => x.Gasto).WithMany(g => g.Reparto).HasForeignKey(x => x.GastoId)
             .OnDelete(DeleteBehavior.Cascade);
            d.HasOne(x => x.Miembro).WithMany().HasForeignKey(x => x.MiembroId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}