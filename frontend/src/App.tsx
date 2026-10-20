import { useEffect, useState, type FormEvent } from "react";
import {
  agregarGasto,
  agregarMiembro,
  crearGrupo,
  eliminarGasto,
  listarGastos,
  obtenerBalances,
  obtenerGrupo,
  obtenerSaldos,
  type Balance,
  type Gasto,
  type Grupo,
  type ModoReparto,
  type Moneda,
  type Transferencia,
} from "./api";
import { Avatar } from "./Avatar";
import { fecha, formatear, nombreMoneda } from "./formato";
import { Graficos } from "./Graficos";
import { generarResumen } from "./resumen";

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

  async function abrir(e: FormEvent) {
    e.preventDefault();
    try {
      setError("");
      const g = await obtenerGrupo(codigo.trim());
      window.location.hash = `/${g.codigoInvitacion}`;
      setGrupo(g);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function crear(e: FormEvent) {
    e.preventDefault();
    try {
      setError("");
      const g = await crearGrupo(nombre);
      window.location.hash = `/${g.codigoInvitacion}`;
      setGrupo(g);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function salir() {
    window.location.hash = "";
    setGrupo(null);
    setNombre("");
    setCodigo("");
    setError("");
  }

  return (
    <main className="app">
      <header className="brand">
        <div className="logo">💸</div>
        <h1>Cuentas Claras</h1>
        {!grupo && (
          <p className="tagline">
            Dividí gastos con tus amigos y pagá con la menor cantidad de transferencias.
          </p>
        )}
      </header>

      {cargando ? (
        <p className="muted">Cargando...</p>
      ) : grupo ? (
        <GrupoView grupo={grupo} onGrupo={setGrupo} onSalir={salir} />
      ) : (
        <>
          <form className="card stack" onSubmit={crear}>
            <h3>Crear un grupo</h3>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre (ej: Asado del sábado)"
            />
            <button className="btn btn-primary" disabled={!nombre.trim()}>
              Crear grupo
            </button>
          </form>

          <form className="card stack" onSubmit={abrir}>
            <h3>¿Ya tenés un código?</h3>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código de invitación"
            />
            <button className="btn" disabled={!codigo.trim()}>
              Entrar al grupo
            </button>
          </form>
        </>
      )}

      {error && <p className="error">{error}</p>}
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
  const [modo, setModo] = useState<ModoReparto>("igual");
  const [moneda, setMoneda] = useState<Moneda>("ARS");
  const [valores, setValores] = useState<Record<number, string>>({});
  const [saldos, setSaldos] = useState<Transferencia[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  const codigo = grupo.codigoInvitacion;
  const pagador = pagadoPorId || String(grupo.miembros[0]?.id ?? "");
  const participantes = grupo.miembros.filter((m) => !excluidos.includes(m.id));
  const participantesIds = participantes.map((m) => m.id);

  const totales = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.moneda] = (acc[g.moneda] ?? 0) + g.monto;
    return acc;
  }, {});
  const totalesTexto = (Object.keys(totales) as Moneda[])
    .map((m) => formatear(totales[m], m))
    .join(" · ");

  const monedasSaldos = [...new Set(saldos.map((t) => t.moneda))];
  const monedasBalances = [...new Set(balances.map((b) => b.moneda))];

  const montoNum = Number(monto) || 0;
  const sumaReparto = participantes.reduce((acc, m) => acc + (Number(valores[m.id]) || 0), 0);
  const repartoValido =
    modo === "igual" ||
    Math.round(sumaReparto * 100) === Math.round((modo === "porcentaje" ? 100 : montoNum) * 100);

  async function refrescar() {
    const [s, g, b] = await Promise.all([
      obtenerSaldos(codigo),
      listarGastos(codigo),
      obtenerBalances(codigo),
    ]);
    setSaldos(s);
    setGastos(g);
    setBalances(b);
  }

  useEffect(() => {
    refrescar().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  async function onAgregarMiembro(e: FormEvent) {
    e.preventDefault();
    try {
      setError("");
      const m = await agregarMiembro(codigo, nuevo);
      onGrupo({ ...grupo, miembros: [...grupo.miembros, m] });
      setNuevo("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onAgregarGasto(e: FormEvent) {
    e.preventDefault();
    if (!repartoValido) return;
    try {
      setError("");
      await agregarGasto(codigo, {
        descripcion,
        monto: montoNum,
        moneda,
        pagadoPorId: Number(pagador),
        participantesIds,
        modoReparto: modo,
        reparto:
          modo === "igual"
            ? undefined
            : participantesIds.map((id) => ({
                miembroId: id,
                valor: Math.round((Number(valores[id]) || 0) * 100) / 100,
              })),
      });
      setDescripcion("");
      setMonto("");
      setModo("igual");
      setValores({});
      await refrescar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onEliminarGasto(g: Gasto) {
    if (!window.confirm(`¿Borrar "${g.descripcion}" (${formatear(g.monto, g.moneda)})?`)) return;
    try {
      setError("");
      await eliminarGasto(codigo, g.id);
      await refrescar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function toggleParticipante(id: number) {
    setExcluidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function cambiarModo(nuevoModo: ModoReparto) {
    setModo(nuevoModo);
    if (nuevoModo === "igual") return;

    const total = nuevoModo === "porcentaje" ? 100 : montoNum;
    if (participantes.length === 0 || total <= 0) return;

    // Prellena con un reparto parejo para que solo haya que ajustar diferencias
    const base = Math.floor((total * 100) / participantes.length) / 100;
    const prellenado: Record<number, string> = {};
    participantes.forEach((m, i) => {
      const valor =
        i === 0 ? Math.round((total - base * (participantes.length - 1)) * 100) / 100 : base;
      prellenado[m.id] = String(valor);
    });
    setValores(prellenado);
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/#/${codigo}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function compartirResumen() {
    const texto = generarResumen(
      grupo.nombre,
      balances,
      saldos,
      gastos,
      `${window.location.origin}/#/${codigo}`,
    );

    // En el celular conviene el menú nativo; en la compu cae directo en WhatsApp Web
    if (navigator.share) {
      try {
        await navigator.share({ title: grupo.nombre, text: texto });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  return (
    <>
      <section className="card">
        <h2>{grupo.nombre}</h2>
        <div className="row">
          <span className="muted">Código</span>
          <span className="code">{codigo}</span>
          <span className="grow" />
          <button className="btn btn-small" onClick={copiarLink}>
            {copiado ? "¡Copiado!" : "🔗 Copiar link"}
          </button>
          <button className="btn btn-small" onClick={onSalir}>
            Salir
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-title">
          <h3>Quién le paga a quién</h3>
          <button className="btn btn-small" onClick={compartirResumen}>
            💬 Compartir resumen
          </button>
        </div>
        {saldos.length === 0 ? (
          <p className="empty">Sin deudas pendientes 🎉</p>
        ) : (
          monedasSaldos.map((m) => (
            <div key={m}>
              {monedasSaldos.length > 1 && <p className="moneda-titulo">{nombreMoneda(m)}</p>}
              {saldos
                .filter((t) => t.moneda === m)
                .map((t, i) => (
                  <div className="debt" key={`${t.de}-${t.a}-${i}`}>
                    <Avatar nombre={t.de} />
                    <span className="who">
                      <strong>{t.de}</strong> <span className="muted">le paga a</span>{" "}
                      <strong>{t.a}</strong>
                    </span>
                    <span className="amount">{formatear(t.monto, t.moneda)}</span>
                  </div>
                ))}
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h3>Balance de cada uno</h3>
        {balances.length === 0 ? (
          <p className="empty">Todavía no hay movimientos.</p>
        ) : (
          <div>
            {monedasBalances.map((m) => (
              <div key={m}>
                {monedasBalances.length > 1 && (
                  <p className="moneda-titulo">{nombreMoneda(m)}</p>
                )}
                {balances
                  .filter((b) => b.moneda === m)
                  .map((b) => (
                    <div className="balance" key={`${b.nombre}-${b.moneda}`}>
                      <Avatar nombre={b.nombre} />
                      <div className="who">
                        <strong>{b.nombre}</strong>
                        <div className="muted">
                          Pagó {formatear(b.pagado, b.moneda)} · le tocaba{" "}
                          {formatear(b.corresponde, b.moneda)}
                        </div>
                      </div>
                      <span className={`amount ${b.saldo > 0 ? "pos" : b.saldo < 0 ? "neg" : ""}`}>
                        {b.saldo > 0 ? "+" : ""}
                        {formatear(b.saldo, b.moneda)}
                      </span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Lo que alguien puso de más se le compensa con lo que debe, por eso las transferencias
          pueden ser menos que los gastos cargados.
        </p>
      </section>

      <Graficos balances={balances} />

      <section className="card">
        <h3>Miembros</h3>
        {grupo.miembros.length > 0 && (
          <div className="chips" style={{ marginBottom: "0.75rem" }}>
            {grupo.miembros.map((m) => (
              <span className="chip" key={m.id}>
                <Avatar nombre={m.nombre} />
                {m.nombre}
              </span>
            ))}
          </div>
        )}
        <form className="row" onSubmit={onAgregarMiembro}>
          <input
            className="grow"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Nombre del nuevo miembro"
          />
          <button className="btn btn-primary" disabled={!nuevo.trim()}>
            Agregar
          </button>
        </form>
      </section>

      {grupo.miembros.length > 0 && (
        <form className="card stack" onSubmit={onAgregarGasto}>
          <h3>Cargar un gasto</h3>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="¿En qué se gastó? (ej: Carne)"
          />
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Monto"
          />
          <div>
            <label className="field-label">Moneda</label>
            <div className="segmented" role="group" aria-label="Moneda del gasto">
              {(
                [
                  ["ARS", "Pesos ($)"],
                  ["USD", "Dólares (US$)"],
                ] as const
              ).map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  className={moneda === id ? "on" : ""}
                  aria-pressed={moneda === id}
                  onClick={() => setMoneda(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Pagó</label>
            <select value={pagador} onChange={(e) => setPagadoPorId(e.target.value)}>
              {grupo.miembros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Se reparte entre</label>
            <div className="chips">
              {grupo.miembros.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={`chip ${excluidos.includes(m.id) ? "" : "on"}`}
                  aria-pressed={!excluidos.includes(m.id)}
                  onClick={() => toggleParticipante(m.id)}
                >
                  <Avatar nombre={m.nombre} />
                  {m.nombre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Cómo se reparte</label>
            <div className="segmented" role="group" aria-label="Cómo se reparte">
              {(
                [
                  ["igual", "Partes iguales"],
                  ["porcentaje", "Porcentaje"],
                  ["montos", "Montos"],
                ] as const
              ).map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  className={modo === id ? "on" : ""}
                  aria-pressed={modo === id}
                  onClick={() => cambiarModo(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {modo !== "igual" && (
            <div>
              <label className="field-label">
                {modo === "porcentaje" ? "Porcentaje de cada uno" : "Monto de cada uno"}
              </label>
              <div className="reparto">
                {participantes.map((m) => (
                  <div className="reparto-row" key={m.id}>
                    <span className="who">
                      <Avatar nombre={m.nombre} />
                      {m.nombre}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={valores[m.id] ?? ""}
                      onChange={(e) => setValores((v) => ({ ...v, [m.id]: e.target.value }))}
                      placeholder={modo === "porcentaje" ? "%" : "$"}
                      aria-label={`${modo === "porcentaje" ? "Porcentaje" : "Monto"} de ${m.nombre}`}
                    />
                    {modo === "porcentaje" && <span className="suffix">%</span>}
                  </div>
                ))}
              </div>
              {participantes.length === 0 ? (
                <p className="hint">Elegí al menos un participante.</p>
              ) : (
                <p className={`hint ${repartoValido ? "" : "bad"}`}>
                  {modo === "porcentaje"
                    ? `Suma ${sumaReparto.toLocaleString("es-AR", { maximumFractionDigits: 2 })}% de 100%`
                    : `Suma ${formatear(sumaReparto, moneda)} de ${formatear(montoNum, moneda)}`}
                </p>
              )}
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={
              !descripcion.trim() || !(montoNum > 0) || participantesIds.length === 0 || !repartoValido
            }
          >
            Agregar gasto
          </button>
        </form>
      )}

      <section className="card">
        <h3>Historial de gastos</h3>
        {gastos.length > 0 && (
          <p className="total">
            Total gastado: <strong>{totalesTexto}</strong>
          </p>
        )}
        {gastos.length === 0 ? (
          <p className="empty">Todavía no se cargó ningún gasto.</p>
        ) : (
          gastos.map((g) => (
            <div className="expense" key={g.id}>
              <div>
                <strong>{g.descripcion}</strong>
                <div className="muted">
                  Pagó {g.pagadoPor} · {fecha(g.fecha)}
                </div>
                <div className="muted">
                  {g.reparto.length > 0
                    ? `Reparto: ${g.reparto
                        .map((r) => `${r.nombre} ${formatear(r.monto, g.moneda)}`)
                        .join(" · ")}`
                    : `Entre ${g.participantes.join(", ")}`}
                </div>
              </div>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <span className="amount">{formatear(g.monto, g.moneda)}</span>
                <button className="btn-icon" onClick={() => onEliminarGasto(g)} title="Borrar gasto">
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {error && <p className="error">{error}</p>}
    </>
  );
}