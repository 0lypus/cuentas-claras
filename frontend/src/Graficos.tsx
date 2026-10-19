import type { Balance } from "./api";
import { Avatar } from "./Avatar";
import { plata } from "./formato";

/**
 * Compara lo que puso cada persona con lo que le tocaba, para ver de un vistazo
 * quién puso de más y quién puso de menos.
 */
export function Graficos({ balances }: { balances: Balance[] }) {
  const total = balances.reduce((acc, b) => acc + b.pagado, 0);
  if (total === 0) return null;

  const maximo = Math.max(...balances.flatMap((b) => [b.pagado, b.corresponde]));
  const promedio = total / balances.length;

  const ancho = (valor: number) => {
    if (maximo <= 0 || valor <= 0) return 0;
    return Math.max((valor / maximo) * 100, 2);
  };

  return (
    <section className="card">
      <h3>Cómo se reparte</h3>

      <div className="stats">
        <div>
          <span className="stat">{plata.format(total)}</span>
          <span className="muted">Total gastado</span>
        </div>
        <div>
          <span className="stat">{plata.format(promedio)}</span>
          <span className="muted">Promedio por persona</span>
        </div>
      </div>

      <div className="leyenda">
        <span>
          <i className="dot dot-pagado" /> Pagó
        </span>
        <span>
          <i className="dot dot-tocaba" /> Le tocaba
        </span>
      </div>

      <div className="grafico">
        {balances.map((b) => (
          <div key={b.nombre}>
            <div className="grafico-nombre">
              <Avatar nombre={b.nombre} />
              {b.nombre}
            </div>
            <div className="grafico-barras">
              <div className="barra-linea">
                <div className="barra-track">
                  <div className="barra pagado" style={{ width: `${ancho(b.pagado)}%` }} />
                </div>
                <span className="barra-valor">{plata.format(b.pagado)}</span>
              </div>
              <div className="barra-linea">
                <div className="barra-track">
                  <div className="barra tocaba" style={{ width: `${ancho(b.corresponde)}%` }} />
                </div>
                <span className="barra-valor">{plata.format(b.corresponde)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
