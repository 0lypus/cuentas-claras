namespace CuentasClaras.Core.Entities;

/// <summary>
/// Monto exacto que le toca pagar a un miembro en un gasto con reparto a medida
/// (por porcentaje o por montos fijos). Los gastos a partes iguales no tienen filas acá.
/// </summary>
public class DetalleReparto
{
    public int Id { get; set; }

    public int GastoId { get; set; }
    public GastoRegistrado Gasto { get; set; } = null!;

    public int MiembroId { get; set; }
    public Miembro Miembro { get; set; } = null!;

    public decimal Monto { get; set; }
}
