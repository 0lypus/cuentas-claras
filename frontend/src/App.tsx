import { useEffect, useState } from "react";
import {
  agregarGasto,
  agregarMiembro,
  crearGrupo,
  eliminarGasto,
  listarGastos,
  obtenerGrupo,
  obtenerSaldos,
  type Gasto,
  type Grupo,
  type Transferencia,
} from "./api";

const plata = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function App() {
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");

  // Si la URL trae un código (#/abc123), abre ese grupo directo
  useEffect(() => {
    const c = window.location.hash.replace(/^#\/?/, "");
    if (!c) {
      setCargando(false);
      return;
    }
    obtenerGrupo(c)
      .then(setGrupo)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  async function abrir() {
    try {
      setError("");
      const g = await obtenerGrupo(codigo.trim());
      window.location.hash = `/${g.codigoInvitacion}`;
      setGrupo(g);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function crear() {
    try {
      setError("");
      const g = await crearGrupo(nombre);
      window.location.hash = `/${g.codigoInvitacion}`;
      setGrupo(g);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function salir() {
    window.location.hash = "";
    setGrupo(null);
    setNombre("");
    setCodigo("");
  }

  return (
    <main style={{ maxWidth: 520, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui" }}>
      <h1>💸 Cuentas Claras</h1>

      {cargando ? (
        <p>Cargando...</p>
      ) : grupo ? (
        <GrupoView grupo={grupo} onGrupo={setGrupo} onSalir={salir} />
      ) : (
        <>
          <h3>Crear un grupo</h3>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre (ej: Asado del sábado)"
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
          <button onClick={crear} disabled={!nombre.trim()} style={{ marginTop: 8 }}>
            Crear grupo
          </button>

          <h3 style={{ marginTop: 32 }}>¿Ya tenés un código?</h3>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código de invitación"
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
          <button onClick={abrir} disabled={!codigo.trim()} style={{ marginTop: 8 }}>
            Entrar al grupo
          </button>
        </>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}

function GrupoView({
  grupo,
  onGrupo,
  onSalir,
}: {
  grupo: Grupo;
  onGrupo: (g: Grupo) => void;
  onSalir: () => void;
}) {
  const [nuevo, setNuevo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [pagadoPorId, setPagadoPorId] = useState("");
  const [excluidos, setExcluidos] = useState<number[]>([]);
  const [saldos, setSaldos] = useState<Transferencia[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  const codigo = grupo.codigoInvitacion;
  const pagador = pagadoPorId || String(grupo.miembros[0]?.id ?? "");
  const participantesIds = grupo.miembros.filter((m) => !excluidos.includes(m.id)).map((m) => m.id);

  useEffect(() => {
    Promise.all([obtenerSaldos(codigo), listarGastos(codigo)])
      .then(([s, g]) => {
        setSaldos(s);
        setGastos(g);
      })
      .catch((e) => setError(e.message));
  }, [codigo]);

  async function refrescar() {
    const [s, g] = await Promise.all([obtenerSaldos(codigo), listarGastos(codigo)]);
    setSaldos(s);
    setGastos(g);
  }

  async function onAgregarMiembro() {
    try {
      setError("");
      const m = await agregarMiembro(codigo, nuevo);
      onGrupo({ ...grupo, miembros: [...grupo.miembros, m] });
      setNuevo("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onAgregarGasto() {
    try {
      setError("");
      await agregarGasto(codigo, {
        descripcion,
        monto: Number(monto),
        pagadoPorId: Number(pagador),
        participantesIds,
      });
      setDescripcion("");
      setMonto("");
      await refrescar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onEliminarGasto(g: Gasto) {
    if (!window.confirm(`¿Borrar "${g.descripcion}" (${plata.format(g.monto)})?`)) return;
    try {
      setError("");
      await eliminarGasto(codigo, g.id);
      await refrescar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function toggleParticipante(id: number) {
    setExcluidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/#/${codigo}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <h2>{grupo.nombre}</h2>
      <p>
        Código: <code>{codigo}</code>{" "}
        <button onClick={copiarLink}>{copiado ? "¡Copiado!" : "Copiar link de invitación"}</button>{" "}
        <button onClick={onSalir}>Salir</button>
      </p>

      <h3>Miembros</h3>
      <p>{grupo.miembros.length ? grupo.miembros.map((m) => m.nombre).join(", ") : "Todavía no hay nadie."}</p>
      <input
        value={nuevo}
        onChange={(e) => setNuevo(e.target.value)}
        placeholder="Nombre del nuevo miembro"
        style={{ padding: 8 }}
      />{" "}
      <button onClick={onAgregarMiembro} disabled={!nuevo.trim()}>
        Agregar
      </button>

      {grupo.miembros.length > 0 && (
        <>
          <h3>Cargar un gasto</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿En qué se gastó? (ej: Carne)"
              style={{ padding: 8 }}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Monto"
              style={{ padding: 8 }}
            />
            <label>
              Pagó:{" "}
              <select value={pagador} onChange={(e) => setPagadoPorId(e.target.value)}>
                {grupo.miembros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>
            <div>
              Se reparte entre:
              {grupo.miembros.map((m) => (
                <label key={m.id} style={{ marginLeft: 12 }}>
                  <input
                    type="checkbox"
                    checked={!excluidos.includes(m.id)}
                    onChange={() => toggleParticipante(m.id)}
                  />{" "}
                  {m.nombre}
                </label>
              ))}
            </div>
            <button
              onClick={onAgregarGasto}
              disabled={!descripcion.trim() || !(Number(monto) > 0) || participantesIds.length === 0}
            >
              Agregar gasto
            </button>
          </div>
        </>
      )}

      <h3>Quién le paga a quién</h3>
      {saldos.length === 0 ? (
        <p>Sin deudas pendientes 🎉</p>
      ) : (
        <ul>
          {saldos.map((t, i) => (
            <li key={i}>
              <strong>{t.de}</strong> le paga a <strong>{t.a}</strong> {plata.format(t.monto)}
            </li>
          ))}
        </ul>
      )}

      <h3>Historial de gastos</h3>
      {gastos.length === 0 ? (
        <p>Todavía no se cargó ningún gasto.</p>
      ) : (
        <ul style={{ paddingLeft: 0, listStyle: "none" }}>
          {gastos.map((g) => (
            <li key={g.id} style={{ padding: "8px 0", borderBottom: "1px solid #ddd" }}>
              <div>
                <strong>{g.descripcion}</strong> · {plata.format(g.monto)}{" "}
                <button onClick={() => onEliminarGasto(g)} title="Borrar gasto">
                  🗑
                </button>
              </div>
              <small>
                Pagó {g.pagadoPor} · entre {g.participantes.join(", ")} ·{" "}
                {new Date(g.fecha).toLocaleDateString("es-AR")}
              </small>
            </li>
          ))}
        </ul>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </>
  );
}