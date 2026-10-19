namespace CuentasClaras.Core.Services;

/// <summary>
/// Cómo se divide un gasto entre sus participantes.
/// </summary>
public enum ModoReparto
{
    /// <summary>El monto se divide en partes iguales (por defecto).</summary>
    Iguales,
    /// <summary>Cada participante declara un porcentaje del monto; deben sumar 100.</summary>
    Porcentaje,
    /// <summary>Cada participante declara un monto fijo; deben sumar el monto del gasto.</summary>
    Montos
}

/// <summary>
/// Reglas de reparto de un gasto. Siempre devuelve montos en centavos que suman exactamente
/// el monto del gasto, para que los balances sigan cerrando en cero.
/// </summary>
public static class RepartoDeGastos
{
    public static List<decimal> EnPartesIguales(decimal monto, int participantes)
    {
        if (participantes <= 0)
            throw new ArgumentException("Un gasto necesita al menos un participante.");

        var parte = Math.Round(monto / participantes, 2, MidpointRounding.ToZero);
        var resto = monto - parte * participantes;

        // El centavo sobrante va al primer participante, como en el reparto clásico
        return Enumerable.Range(0, participantes)
            .Select(i => i == 0 ? parte + resto : parte)
            .ToList();
    }

    public static List<decimal> PorPorcentaje(decimal monto, IReadOnlyList<decimal> porcentajes)
    {
        if (porcentajes.Count == 0)
            throw new ArgumentException("Un gasto necesita al menos un participante.");
        if (porcentajes.Any(p => p < 0))
            throw new ArgumentException("Los porcentajes no pueden ser negativos.");
        if (Math.Abs(porcentajes.Sum() - 100m) > 0.01m)
            throw new ArgumentException("Los porcentajes tienen que sumar 100.");

        var suma = porcentajes.Sum();
        var exactos = porcentajes.Select(p => monto * p / suma).ToList();
        var montos = exactos.Select(x => Math.Round(x, 2, MidpointRounding.ToZero)).ToList();

        // Los centavos que sobran se asignan por mayor resto, para que el reparto quede lo más
        // parejo posible respecto de lo que se pidió
        var centavos = (int)((monto - montos.Sum()) * 100);
        var porResto = exactos
            .Select((x, i) => (i, frac: x - montos[i]))
            .OrderByDescending(t => t.frac)
            .ThenBy(t => t.i)
            .Select(t => t.i)
            .ToList();

        for (var c = 0; c < centavos; c++)
            montos[porResto[c % porResto.Count]] += 0.01m;

        return montos;
    }

    public static List<decimal> MontosFijos(decimal monto, IReadOnlyList<decimal> montos)
    {
        if (montos.Count == 0)
            throw new ArgumentException("Un gasto necesita al menos un participante.");
        if (montos.Any(m => m < 0))
            throw new ArgumentException("Los montos no pueden ser negativos.");
        if (montos.Any(m => m == 0))
            throw new ArgumentException("Cada participante tiene que tener un monto mayor a 0.");

        var redondeados = montos.Select(m => Math.Round(m, 2)).ToList();
        if (redondeados.Sum() != monto)
            throw new ArgumentException("Los montos fijos tienen que sumar exactamente el monto del gasto.");

        return redondeados;
    }
}
