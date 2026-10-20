import type { Moneda } from "./api";

const formatos: Record<Moneda, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }),
  USD: new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD" }),
};

export const formatear = (monto: number, moneda: Moneda = "ARS") =>
  (formatos[moneda] ?? formatos.ARS).format(monto);

export const nombreMoneda = (moneda: Moneda) => (moneda === "USD" ? "Dólares" : "Pesos");

export const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-AR");
