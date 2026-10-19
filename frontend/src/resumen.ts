import type { Balance, Gasto, Transferencia } from "./api";
import { plata } from "./formato";

/**
 * Arma el texto que se comparte por WhatsApp: total, transferencias y balance de cada uno.
 * Usa el formato de WhatsApp (*negrita*, _cursiva_) y viñetas para que se lea bien en el chat.
 */
export function generarResumen(
  nombreGrupo: string,
  balances: Balance[],
  saldos: Transferencia[],
  gastos: Gasto[],
  link?: string,
): string {
  const total = gastos.reduce((acc, g) => acc + g.monto, 0);
  const lineas = [`*${nombreGrupo}* 💸`, `Total gastado: ${plata.format(total)}`, ""];

  if (saldos.length === 0) {
    lineas.push("✅ No hay deudas pendientes.");
  } else {
    lineas.push("*Quién le paga a quién*");
    for (const t of saldos) {
      lineas.push(`• ${t.de} → ${t.a}: ${plata.format(t.monto)}`);
    }
  }

  if (balances.length > 0) {
    lineas.push("", "*Balance de cada uno*");
    for (const b of balances) {
      const signo = b.saldo > 0 ? "+" : "";
      lineas.push(`• ${b.nombre}: ${signo}${plata.format(b.saldo)}`);
    }
  }

  if (link) {
    lineas.push("", `Sumate al grupo: ${link}`);
  }

  lineas.push("", "_Hecho con Cuentas Claras_");
  return lineas.join("\n");
}
