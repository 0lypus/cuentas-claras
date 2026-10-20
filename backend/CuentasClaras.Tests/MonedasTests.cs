using CuentasClaras.Core.Models;
using CuentasClaras.Core.Services;

namespace CuentasClaras.Tests;

public class MonedasTests
{
    [Fact]
    public void CadaMonedaSeCompensaPorSeparado()
    {
        var gastos = new[]
        {
            new Gasto("Ana", 1000m, ["Ana", "Beto"]),
            new Gasto("Beto", 10m, ["Ana", "Beto"], Moneda: Monedas.Dolar),
        };

        var resultado = SimplificadorDeDeudas.Calcular(gastos);

        Assert.Equal(2, resultado.Count);
        Assert.Contains(new Transferencia("Beto", "Ana", 500m, Monedas.Peso), resultado);
        Assert.Contains(new Transferencia("Ana", "Beto", 5m, Monedas.Dolar), resultado);
    }

    [Fact]
    public void LosBalancesIncluyenLaMonedaYNoSeMezclan()
    {
        var gastos = new[]
        {
            new Gasto("Ana", 1000m, ["Ana", "Beto"]),
            new Gasto("Beto", 10m, ["Ana", "Beto"], Moneda: Monedas.Dolar),
        };

        var balances = SimplificadorDeDeudas.CalcularBalances(gastos, ["Ana", "Beto"]);

        Assert.Equal(4, balances.Count);
        Assert.Equal(500m, balances.Single(b => b.Nombre == "Ana" && b.Moneda == Monedas.Peso).Saldo);
        Assert.Equal(-5m, balances.Single(b => b.Nombre == "Ana" && b.Moneda == Monedas.Dolar).Saldo);
    }

    [Fact]
    public void SinGastos_DevuelveLosMiembrosEnPesos()
    {
        var balances = SimplificadorDeDeudas.CalcularBalances([], ["Ana"]);

        var balance = Assert.Single(balances);
        Assert.Equal(Monedas.Peso, balance.Moneda);
        Assert.Equal(0m, balance.Saldo);
    }

    [Fact]
    public void LosSaldosDeCadaMonedaSumanCero()
    {
        var gastos = new[]
        {
            new Gasto("Ana", 1000m, ["Ana", "Beto", "Caro"]),
            new Gasto("Beto", 10m, ["Ana", "Beto"], Moneda: Monedas.Dolar),
            new Gasto("Caro", 25m, ["Beto", "Caro"], Moneda: Monedas.Dolar),
        };

        var balances = SimplificadorDeDeudas.CalcularBalances(gastos);

        foreach (var grupo in balances.GroupBy(b => b.Moneda))
            Assert.Equal(0m, grupo.Sum(b => b.Saldo));
    }
}
