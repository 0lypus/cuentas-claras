using CuentasClaras.Core.Models;

namespace CuentasClaras.Core.Services;

public static class SimplificadorDeDeudas
{
    public static List<Transferencia> Calcular(IEnumerable<Gasto> gastos)
    {
        ArgumentNullException.ThrowIfNull(gastos);

        var saldos = new Dictionary<string, decimal>(StringComparer.Ordinal);

        foreach (var gasto in gastos)
        {
            if (gasto is null)
                continue;

            var participantes = gasto.Participantes?.Distinct().ToList() ?? [];

            if (participantes.Count == 0)
                throw new ArgumentException("Un gasto necesita al menos un participante.");

            var parte = decimal.Round(gasto.Monto / participantes.Count, 2, MidpointRounding.ToZero);
            var resto = gasto.Monto - (parte * participantes.Count);

            saldos[gasto.PagadoPor] = saldos.GetValueOrDefault(gasto.PagadoPor) + gasto.Monto;

            for (var i = 0; i < participantes.Count; i++)
            {
                var nombre = participantes[i];
                var debe = i == 0 ? parte + resto : parte;
                saldos[nombre] = saldos.GetValueOrDefault(nombre) - debe;
            }
        }

        var acreedores = saldos
            .Where(s => s.Value > 0m)
            .OrderByDescending(x => x.Value)
            .ThenBy(x => x.Key, StringComparer.Ordinal)
            .ToDictionary(x => x.Key, x => x.Value, StringComparer.Ordinal);

        var deudores = saldos
            .Where(s => s.Value < 0m)
            .OrderByDescending(x => -x.Value)
            .ThenBy(x => x.Key, StringComparer.Ordinal)
            .ToDictionary(x => x.Key, x => -x.Value, StringComparer.Ordinal);

        var transferencias = new List<Transferencia>();

        while (acreedores.Count > 0 && deudores.Count > 0)
        {
            var acreedor = acreedores.First();
            var deudor = deudores.First();
            var monto = Math.Min(acreedor.Value, deudor.Value);

            transferencias.Add(new Transferencia(deudor.Key, acreedor.Key, monto));

            if (acreedor.Value == monto)
                acreedores.Remove(acreedor.Key);
            else
                acreedores[acreedor.Key] = acreedor.Value - monto;

            if (deudor.Value == monto)
                deudores.Remove(deudor.Key);
            else
                deudores[deudor.Key] = deudor.Value - monto;

            acreedores = acreedores
                .OrderByDescending(x => x.Value)
                .ThenBy(x => x.Key, StringComparer.Ordinal)
                .ToDictionary(x => x.Key, x => x.Value, StringComparer.Ordinal);

            deudores = deudores
                .OrderByDescending(x => x.Value)
                .ThenBy(x => x.Key, StringComparer.Ordinal)
                .ToDictionary(x => x.Key, x => x.Value, StringComparer.Ordinal);
        }

        return transferencias;
    }
}
