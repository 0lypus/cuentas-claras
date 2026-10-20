namespace CuentasClaras.Core.Models;

public record Balance(string Nombre, decimal Pagado, decimal Corresponde, decimal Saldo, string Moneda = Monedas.Peso);
