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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("No se encontró el grupo.");
    throw new Error((await res.text()) || `Error ${res.status}`);
  }
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

export const obtenerSaldos = (codigo: string) =>
  request<Transferencia[]>(`/api/grupos/${codigo}/saldos`);