using CuentasClaras.Core.Models;

namespace CuentasClaras.Core.Services;

public static class SimplificadorDeDeudas
{
    public static List<Transferencia> Calcular(IEnumerable<Gasto> gastos)
    {
        var saldos = new Dictionary<string, decimal>();

        foreach (var gasto in gastos)
        {
            if (gasto.Participantes.Count == 0)
                throw new ArgumentException("Un gasto necesita al menos un participante.");

            var parte = Math.Round(gasto.Monto / gasto.Participantes.Count, 2, MidpointRounding.ToZero);
            var resto = gasto.Monto - parte * gasto.Participantes.Count;

            saldos[gasto.PagadoPor] = saldos.GetValueOrDefault(gasto.PagadoPor) + gasto.Monto;

            for (var i = 0; i < gasto.Participantes.Count; i++)
            {
                var nombre = gasto.Participantes[i];
                var debe = i == 0 ? parte + resto : parte;
                saldos[nombre] = saldos.GetValueOrDefault(nombre) - debe;
            }
        }

        var acreedores = saldos.Where(s => s.Value > 0).ToDictionary(s => s.Key, s => s.Value);
        var deudores = saldos.Where(s => s.Value < 0).ToDictionary(s => s.Key, s => -s.Value);

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