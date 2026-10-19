namespace CuentasClaras.Core.Entities;

public class GastoRegistrado
{
    public int Id { get; set; }
    public int GrupoId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public int PagadoPorId { get; set; }
    public Miembro PagadoPor { get; set; } = null!;

    public List<Miembro> Participantes { get; set; } = [];
    public List<DetalleReparto> Reparto { get; set; } = [];
    public Grupo Grupo { get; set; } = null!;
}