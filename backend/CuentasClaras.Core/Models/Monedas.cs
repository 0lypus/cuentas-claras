namespace CuentasClaras.Core.Models;

/// <summary>
/// Monedas con las que se pueden cargar gastos. No se convierten entre sí:
/// cada moneda tiene sus propios balances y transferencias.
/// </summary>
public static class Monedas
{
    public const string Peso = "ARS";
    public const string Dolar = "USD";

    public static readonly IReadOnlySet<string> Soportadas = new HashSet<string> { Peso, Dolar };

    public static string Normalizar(string? moneda) =>
        string.IsNullOrWhiteSpace(moneda) ? Peso : moneda.Trim().ToUpperInvariant();

    public static bool EsSoportada(string moneda) => Soportadas.Contains(moneda);
}
