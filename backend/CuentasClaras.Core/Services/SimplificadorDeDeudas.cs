using CuentasClaras.Core.Models;

namespace CuentasClaras.Core.Services;

public static class SimplificadorDeDeudas
{
    public static List<Balance> CalcularBalances(IEnumerable<Gasto> gastos, IEnumerable<string>? miembros = null)
    {
        var pagado = new Dictionary<string, decimal>();
        var corresponde = new Dictionary<string, decimal>();

        // Así aparecen también los miembros que todavía no participaron de ningún gasto
        foreach (var nombre in miembros ?? Array.Empty<string>())
        {
            pagado[nombre] = 0m;
            corresponde[nombre] = 0m;
        }

        foreach (var gasto in gastos)
        {
            if (gasto.Participantes.Count == 0)
                throw new ArgumentException("Un gasto necesita al menos un participante.");

            pagado[gasto.PagadoPor] = pagado.GetValueOrDefault(gasto.PagadoPor) + gasto.Monto;

            if (gasto.Reparto is not null)
            {
                // Reparto a medida (porcentaje o montos fijos): cada participante tiene su monto.
                // Se validó al guardar que sumen el monto del gasto, si no los balances no cerrarían.
                if (gasto.Reparto.Values.Sum() != gasto.Monto)
                    throw new ArgumentException("El reparto del gasto no coincide con su monto.");

                foreach (var nombre in gasto.Participantes)
                    corresponde[nombre] = corresponde.GetValueOrDefault(nombre) + gasto.Reparto.GetValueOrDefault(nombre);

                continue;
            }

            // Parte por persona truncada a centavos; el resto va al primer participante
            var partes = RepartoDeGastos.EnPartesIguales(gasto.Monto, gasto.Participantes.Count);
            for (var i = 0; i < gasto.Participantes.Count; i++)
            {
                var nombre = gasto.Participantes[i];
                corresponde[nombre] = corresponde.GetValueOrDefault(nombre) + partes[i];
            }
        }

        return pagado.Keys.Union(corresponde.Keys)
            .Select(n =>
            {
                var p = pagado.GetValueOrDefault(n);
                var c = corresponde.GetValueOrDefault(n);
                return new Balance(n, p, c, p - c);
            })
            .OrderByDescending(b => b.Saldo)
            .ToList();
    }

    public static List<Transferencia> Calcular(IEnumerable<Gasto> gastos)
    {
        var balances = CalcularBalances(gastos);

        var acreedores = balances.Where(b => b.Saldo > 0).ToDictionary(b => b.Nombre, b => b.Saldo);
        var deudores = balances.Where(b => b.Saldo < 0).ToDictionary(b => b.Nombre, b => -b.Saldo);

        var transferencias = new List<Transferencia>();

        while (acreedores.Count > 0 && deudores.Count > 0)
        {
            var acreedor = acreedores.MaxBy(x => x.Value);
            var deudor = deudores.MaxBy(x => x.Value);
            var monto = Math.Min(acreedor.Value, deudor.Value);

            transferencias.Add(new Transferencia(deudor.Key, acreedor.Key, monto));

            if (acreedor.Value == monto) acreedores.Remove(acreedor.Key);
            else acreedores[acreedor.Key] = acreedor.Value - monto;

            if (deudor.Value == monto) deudores.Remove(deudor.Key);
            else deudores[deudor.Key] = deudor.Value - monto;
        }

        return transferencias;
    }
}