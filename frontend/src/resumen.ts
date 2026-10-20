import type { Balance, Gasto, Moneda, Transferencia } from "./api";
import { formatear } from "./formato";

/**
 * Arma el texto que se comparte por WhatsApp: total, transferencias y balance de cada uno.
 * Usa el formato de WhatsApp (*negrita*, _cursiva_) y viñetas para que se lea bien en el chat.
 * Si hay gastos en más de una moneda, cada monto se muestra con su símbolo.
 */
export function generarResumen(
  nombreGrupo: string,
  balances: Balance[],
  saldos: Transferencia[],
  gastos: Gasto[],
  link?: string,
): string {
  const totales = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.moneda] = (acc[g.moneda] ?? 0) + g.monto;
    return acc;
  }, {});
  const totalTexto =
    (Object.keys(totales) as Moneda[])
      .map((moneda) => formatear(totales[moneda], moneda))
      .join(" · ") || formatear(0);

  const lineas = [`*${nombreGrupo}* 💸`, `Total gastado: ${totalTexto}`, ""];

  if (saldos.length === 0) {
    lineas.push("✅ No hay deudas pendientes.");
  } else {
    lineas.push("*Quién le paga a quién*");
    for (const t of saldos) {
      lineas.push(`• ${t.de} → ${t.a}: ${formatear(t.monto, t.moneda)}`);
    }
  }

  if (balances.length > 0) {
    lineas.push("", "*Balance de cada uno*");

    // Cada persona puede tener saldo en más de una moneda
    const porPersona = new Map<string, string[]>();
    for (const b of balances) {
      const valores = porPersona.get(b.nombre) ?? [];
      const signo = b.saldo > 0 ? "+" : "";
      valores.push(`${signo}${formatear(b.saldo, b.moneda)}`);
      porPersona.set(b.nombre, valores);
    }

    for (const [nombre, valores] of porPersona) {
      lineas.push(`• ${nombre}: ${valores.join(" · ")}`);
    }
  }

  if (link) {
    lineas.push("", `Sumate al grupo: ${link}`);
  }

  lineas.push("", "_Hecho con Cuentas Claras_");
  return lineas.join("\n");
}
