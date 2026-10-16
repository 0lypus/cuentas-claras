const API = "http://localhost:5140";

export type Miembro = { id: number; nombre: string };
export type Grupo = {
  id: number;
  nombre: string;
  codigoInvitacion: string;
  miembros: Miembro[];
};
export type Transferencia = { de: string; a: string; monto: number };
export type NuevoGasto = {
  descripcion: string;
  monto: number;
  pagadoPorId: number;
  participantesIds: number[];
};
export type Gasto = {
  id: number;
  descripcion: string;
  monto: number;
  pagadoPor: string;
  participantes: string[];
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
  return res.json();
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