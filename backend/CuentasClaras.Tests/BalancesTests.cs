using CuentasClaras.Core.Models;
using CuentasClaras.Core.Services;

namespace CuentasClaras.Tests;

public class BalancesTests
{
    private static readonly Gasto[] GastosDeEjemplo =
    [
        new Gasto("Ana", 30000m, ["Ana", "Beto", "Caro"]),
        new Gasto("Beto", 15000m, ["Ana", "Beto", "Caro"]),
    ];

    [Fact]
    public void GastoPagadoPorUnDeudor_CompensaSuDeuda()
    {
        var transferencias = SimplificadorDeDeudas.Calcular(GastosDeEjemplo);

        Assert.Single(transferencias);
        Assert.Equal(new Transferencia("Caro", "Ana", 15000m), transferencias[0]);
    }

    [Fact]
    public void LosBalances_SiempreSumanCero()
    {
        var balances = SimplificadorDeDeudas.CalcularBalances(GastosDeEjemplo);

        Assert.Equal(0m, balances.Sum(b => b.Saldo));
    }
}