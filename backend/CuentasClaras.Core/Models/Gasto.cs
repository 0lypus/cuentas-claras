namespace CuentasClaras.Core.Models;

/// <summary>
/// Gasto en términos de dominio: quién lo pagó, cuánto valió, en qué moneda y entre quiénes se reparte.
/// <para>
/// <see cref="Reparto"/> es opcional: si es <c>null</c> el monto se divide en partes iguales.
/// Si tiene valores, mapea cada participante con el monto exacto que le toca y debe sumar <see cref="Monto"/>.
/// </para>
/// </summary>
public record Gasto(
    string PagadoPor,
    decimal Monto,
    IReadOnlyList<string> Participantes,
    IReadOnlyDictionary<string, decimal>? Reparto = null,
    string Moneda = Monedas.Peso);
