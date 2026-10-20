// Página de prueba para el APK: hace un recorrido real contra la API y muestra
// el resultado en pantalla. No forma parte de la app; sirve para verificar en un
// emulador o en un celular conectado por ADB.
import {
  agregarGasto,
  agregarMiembro,
  crearGrupo,
  listarGastos,
  obtenerBalances,
  obtenerGrupo,
  obtenerSaldos,
  type Moneda,
} from "./api";
import { formatear } from "./formato";
import { generarResumen } from "./resumen";
import { enlaceGrupo } from "./enlace";

declare global {
  interface Window {
    crear: () => Promise<void>;
    abrir: () => Promise<void>;
    miembro: () => Promise<void>;
    gasto: () => Promise<void>;
    setMoneda: (m: Moneda) => void;
    compartir: () => Promise<void>;
    copiarLink: () => Promise<void>;
  }
}

const log = (msg: string) => {
  const el = document.getElementById("log")!;
  el.textContent += msg + "\n";
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

let codigo = "";
let moneda: Moneda = "ARS";
let miembros: { id: number; nombre: string }[] = [];

window.setMoneda = (m) => {
  moneda = m;
  $("mon-ARS").className = m === "ARS" ? "on" : "";
  $("mon-USD").className = m === "USD" ? "on" : "";
};

window.crear = async () => {
  try {
    const g = await crearGrupo($<HTMLInputElement>("nombre").value || "Prueba APK");
    codigo = g.codigoInvitacion;
    miembros = g.miembros;
    log(`✅ Grupo creado: ${g.nombre} (código ${codigo})`);
    mostrarFormularios();
  } catch (e) {
    log(`❌ crear: ${(e as Error).message}`);
  }
};

window.abrir = async () => {
  try {
    const c = $<HTMLInputElement>("codigo").value.trim();
    const g = await obtenerGrupo(c);
    codigo = g.codigoInvitacion;
    miembros = g.miembros;
    log(`✅ Grupo abierto: ${g.nombre} (${miembros.length} miembros)`);
    mostrarFormularios();
  } catch (e) {
    log(`❌ abrir: ${(e as Error).message}`);
  }
};

window.miembro = async () => {
  try {
    const m = await agregarMiembro(codigo, $<HTMLInputElement>("miembro").value);
    miembros.push(m);
    log(`✅ Miembro agregado: ${m.nombre} (id ${m.id})`);
    pintarMiembros();
  } catch (e) {
    log(`❌ miembro: ${(e as Error).message}`);
  }
};

window.gasto = async () => {
  try {
    const g = await agregarGasto(codigo, {
      descripcion: $<HTMLInputElement>("descripcion").value,
      monto: Number($<HTMLInputElement>("monto").value),
      moneda,
      pagadoPorId: Number($<HTMLSelectElement>("pagador").value),
      participantesIds: miembros.map((m) => m.id),
    });
    log(`✅ Gasto cargado: ${JSON.stringify(g)}`);
    await verTodo();
  } catch (e) {
    log(`❌ gasto: ${(e as Error).message}`);
  }
};

async function verTodo() {
  const [gastos, saldos, balances] = await Promise.all([
    listarGastos(codigo),
    obtenerSaldos(codigo),
    obtenerBalances(codigo),
  ]);

  log(`\nGastos (${gastos.length}):`);
  for (const g of gastos) {
    log(`  ${g.descripcion} ${formatear(g.monto, g.moneda)} pagó ${g.pagadoPor} [${g.moneda}]`);
  }
  log(`Saldos (${saldos.length}):`);
  for (const s of saldos) {
    log(`  ${s.de} → ${s.a} ${formatear(s.monto, s.moneda)} [${s.moneda}]`);
  }
  log(`Balances (${balances.length}):`);
  for (const b of balances) {
    log(`  ${b.nombre} ${formatear(b.saldo, b.moneda)} [${b.moneda}]`);
  }

  $("saldos").innerHTML = saldos
    .map(
      (s) =>
        `<div class="debt"><span class="who"><strong>${s.de}</strong> le paga a <strong>${s.a}</strong></span><span class="amount">${formatear(s.monto, s.moneda)}</span></div>`,
    )
    .join("");

  log(`\nEnlace de grupo: ${enlaceGrupo(codigo)}`);
  window.__ultimoResumen = generarResumen("Prueba APK", balances, saldos, gastos, enlaceGrupo(codigo));
}

window.compartir = async () => {
  const texto = window.__ultimoResumen ?? "";
  log(`\nTexto del resumen:\n${texto}`);
  const { Capacitor } = await import("@capacitor/core");
  const { Share } = await import("@capacitor/share");
  try {
    await Share.share({ title: "Prueba APK", text: texto, dialogTitle: "Compartir resumen" });
    log(`✅ Hoja nativa de compartir lanzada (plataforma: ${Capacitor.getPlatform()})`);
  } catch (e) {
    log(`❌ compartir: ${(e as Error).message}`);
  }
};

window.copiarLink = async () => {
  const link = enlaceGrupo(codigo);
  try {
    await navigator.clipboard.writeText(link);
    log(`✅ Link copiado: ${link}`);
  } catch (e) {
    log(`❌ copiar: ${(e as Error).message}`);
  }
};

function mostrarFormularios() {
  $("form-miembro").hidden = false;
  $("form-gasto").hidden = false;
  $("card-compartir").hidden = false;
  pintarMiembros();
}

function pintarMiembros() {
  $("pagador").innerHTML = miembros
    .map((m) => `<option value="${m.id}">${m.nombre}</option>`)
    .join("");
  $("participantes").innerHTML = miembros
    .map((m) => `<span class="chip on">${m.nombre}</span>`)
    .join("");
}

declare global {
  interface Window {
    __ultimoResumen?: string;
  }
}

log("Probando API en: " + (import.meta.env.VITE_API_URL ?? "http://localhost:5140"));
