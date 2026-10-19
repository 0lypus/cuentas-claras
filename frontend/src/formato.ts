const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export const plata = formatoMoneda;

export const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-AR");
