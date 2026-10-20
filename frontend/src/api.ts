const API = (import.meta.env.VITE_API_URL ?? "http://localhost:5140").replace(/\/+$/, "");

export type Miembro = { id: number; nombre: string };
export type Grupo = {
  id: number;
  nombre: string;
  codigoInvitacion: string;
  miembros: Miembro[];
};
export type Moneda = "ARS" | "USD";

export type Transferencia = { de: string; a: string; monto: number; moneda: Moneda };

export type ModoReparto = "igual" | "porcentaje" | "montos";

export type NuevoGasto = {
  descripcion: string;
  monto: number;
  pagadoPorId: number;
  participantesIds: number[];
  modoReparto?: ModoReparto;
  reparto?: { miembroId: number; valor: number }[];
  moneda: Moneda;
};

export type DetalleReparto = { nombre: string; monto: number };

export type Gasto = {
  id: number;
  descripcion: string;
  monto: number;
  moneda: Moneda;
  pagadoPor: string;
  participantes: string[];
  reparto: DetalleReparto[];
  fecha: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("No se encontró lo que buscabas.");
    throw new Error((await res.text()) || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  registrarCampos(data);
  return data;
}

/**
 * Los servidores en uso (Render, local) no siempre tienen la última versión de la API.
 * Acá se anota qué campos devolvió, para poder avisar si el servidor es viejo.
 */
export type CampoDeLaApi = "moneda";
const camposVistos = new Set<CampoDeLaApi>();
const observadores = new Set<() => void>();

function registrarCampos(data: unknown) {
  const antes = camposVistos.size;
  if (Array.isArray(data)) {
    if (data.some((x) => x && typeof x === "object" && "moneda" in x)) camposVistos.add("moneda");
  } else if (data && typeof data === "object" && "moneda" in data) {
    camposVistos.add("moneda");
  }
  if (camposVistos.size !== antes) observadores.forEach((f) => f());
}

/** Se suscribe a los cambios y devuelve la función para desuscribirse. */
export function alCambiarCamposDeLaApi(fn: () => void) {
  observadores.add(fn);
  return () => {
    observadores.delete(fn);
  };
}

/** Campo que la API todavía no devuelve, o `null` si está todo al día. */
export function camposDeLaApi(): CampoDeLaApi | null {
  return camposVistos.has("moneda") ? null : "moneda";
}

export const crearGrupo = (nombre: string) =>
  request<Grupo>("/api/grupos", { method: "POST", body: JSON.stringify({ nombre }) });

export const obtenerGrupo = (codigo: string) =>
  request<Grupo>(`/api/grupos/${codigo}`);

export const agregarMiembro = (codigo: string, nombre: string) =>
  request<Miembro>(`/api/grupos/${codigo}/miembros`, {
    method: "POST",
    body: JSON.stringify({ nombre }),
  });

export const agregarGasto = (codigo: string, gasto: NuevoGasto) =>
  request<unknown>(`/api/grupos/${codigo}/gastos`, {
    method: "POST",
    body: JSON.stringify(gasto),
  });

export const listarGastos = (codigo: string) =>
  request<Gasto[]>(`/api/grupos/${codigo}/gastos`);

export const eliminarGasto = (codigo: string, id: number) =>
  request<void>(`/api/grupos/${codigo}/gastos/${id}`, { method: "DELETE" });

export const obtenerSaldos = (codigo: string) =>
  request<Transferencia[]>(`/api/grupos/${codigo}/saldos`);


export type Balance = {
  nombre: string;
  pagado: number;
  corresponde: number;
  saldo: number;
  moneda: Moneda;
};

export const obtenerBalances = (codigo: string) =>
  request<Balance[]>(`/api/grupos/${codigo}/balances`);