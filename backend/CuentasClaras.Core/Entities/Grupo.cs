namespace CuentasClaras.Core.Entities;

public class Grupo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string CodigoInvitacion { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public List<Miembro> Miembros { get; set; } = [];
    public List<GastoRegistrado> Gastos { get; set; } = [];
}