namespace CuentasClaras.Core.Entities;

public class Miembro
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int GrupoId { get; set; }

    public Grupo Grupo { get; set; } = null!;
}