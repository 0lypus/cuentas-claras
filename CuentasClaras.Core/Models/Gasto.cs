namespace CuentasClaras.Core.Models;

public record Gasto(string PagadoPor, decimal Monto, IReadOnlyList<string> Participantes);