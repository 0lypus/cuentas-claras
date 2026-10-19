using CuentasClaras.Core.Services;

namespace CuentasClaras.Tests;

public class RepartoDeGastosTests
{
    [Fact]
    public void EnPartesIguales_ReparteYNoPierdeCentavos()
    {
        var montos = RepartoDeGastos.EnPartesIguales(100m, 3);

        Assert.Equal([33.34m, 33.33m, 33.33m], montos);
        Assert.Equal(100m, montos.Sum());
    }

    [Fact]
    public void PorPorcentaje_RespetaLasPartes()
    {
        var montos = RepartoDeGastos.PorPorcentaje(1000m, [60m, 40m]);

        Assert.Equal([600m, 400m], montos);
    }

    [Fact]
    public void PorPorcentaje_ConCentavosReparteElResto()
    {
        var montos = RepartoDeGastos.PorPorcentaje(10m, [33.33m, 33.33m, 33.34m]);

        Assert.Equal([3.33m, 3.33m, 3.34m], montos);
        Assert.Equal(10m, montos.Sum());
    }

    [Fact]
    public void PorPorcentaje_QueNoSumanCien_EsInvalido()
    {
        var error = Assert.Throws<ArgumentException>(() =>
            RepartoDeGastos.PorPorcentaje(1000m, [50m, 40m]));

        Assert.Contains("100", error.Message);
    }

    [Fact]
    public void MontosFijos_QueNoSumanElTotal_EsInvalido()
    {
        Assert.Throws<ArgumentException>(() =>
            RepartoDeGastos.MontosFijos(1000m, [500m, 400m]));
    }

    [Fact]
    public void MontosFijos_Negativos_EsInvalido()
    {
        Assert.Throws<ArgumentException>(() =>
            RepartoDeGastos.MontosFijos(1000m, [1200m, -200m]));
    }

    [Fact]
    public void MontosFijos_Validos_SeRedondeanACentavos()
    {
        var montos = RepartoDeGastos.MontosFijos(100m, [33.336m, 66.664m]);

        Assert.Equal([33.34m, 66.66m], montos);
        Assert.Equal(100m, montos.Sum());
    }
}
