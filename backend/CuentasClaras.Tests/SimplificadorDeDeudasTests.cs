using CuentasClaras.Core.Models;
using CuentasClaras.Core.Services;

namespace CuentasClaras.Tests;

public class SimplificadorDeDeudasTests
{
    [Fact]
    public void SinGastos_NoHayTransferencias()
    {
        var resultado = SimplificadorDeDeudas.Calcular([]);

        Assert.Empty(resultado);
    }

    [Fact]
    public void CenaPagadaPorUno_LosOtrosLeDebenSuParte()
    {
        var gastos = new[] { new Gasto("Ana", 3000m, ["Ana", "Beto", "Caro"]) };

        var resultado = SimplificadorDeDeudas.Calcular(gastos);

        Assert.Equal(2, resultado.Count);
        Assert.All(resultado, t =>
        {
            Assert.Equal("Ana", t.A);
            Assert.Equal(1000m, t.Monto);
        });
    }

    [Fact]
    public void CadenaDeDeudas_SeSimplificaEnUnaSolaTransferencia()
    {
        var gastos = new[]
        {
            new Gasto("B", 1000m, ["A", "B"]),
            new Gasto("C", 1000m, ["B", "C"]),
        };

        var resultado = SimplificadorDeDeudas.Calcular(gastos);

        Assert.Single(resultado);
        Assert.Equal(new Transferencia("A", "C", 500m), resultado[0]);
    }

    [Fact]
    public void MontoQueNoSeDivideExacto_NoPierdeCentavos()
    {
        var gastos = new[] { new Gasto("Ana", 100m, ["Ana", "Beto", "Caro"]) };

        var resultado = SimplificadorDeDeudas.Calcular(gastos);

        Assert.Equal(66.66m, resultado.Sum(t => t.Monto));
    }

    [Fact]
    public void RepartoAMedida_UsaLoQueLeTocaACadaUno()
    {
        var gastos = new[]
        {
            new Gasto("Ana", 1000m, ["Ana", "Beto", "Caro"],
                new Dictionary<string, decimal> { ["Ana"] = 500m, ["Beto"] = 300m, ["Caro"] = 200m }),
        };

        var resultado = SimplificadorDeDeudas.Calcular(gastos);

        Assert.Equal(2, resultado.Count);
        Assert.Contains(new Transferencia("Beto", "Ana", 300m), resultado);
        Assert.Contains(new Transferencia("Caro", "Ana", 200m), resultado);
    }

    [Fact]
    public void RepartoAMedida_LosBalancesSumanCero()
    {
        var gastos = new[]
        {
            new Gasto("Beto", 900m, ["Ana", "Beto", "Caro"],
                new Dictionary<string, decimal> { ["Ana"] = 150m, ["Beto"] = 450m, ["Caro"] = 300m }),
        };

        var balances = SimplificadorDeDeudas.CalcularBalances(gastos);

        Assert.Equal(0m, balances.Sum(b => b.Saldo));
        Assert.Equal(150m, balances.Single(b => b.Nombre == "Ana").Corresponde);
        Assert.Equal(450m, balances.Single(b => b.Nombre == "Beto").Corresponde);
    }

    [Fact]
    public void RepartoQueNoCoincideConElMonto_EsInvalido()
    {
        var gastos = new[]
        {
            new Gasto("Ana", 1000m, ["Ana", "Beto"],
                new Dictionary<string, decimal> { ["Ana"] = 500m, ["Beto"] = 400m }),
        };

        Assert.Throws<ArgumentException>(() => SimplificadorDeDeudas.CalcularBalances(gastos));
    }
}