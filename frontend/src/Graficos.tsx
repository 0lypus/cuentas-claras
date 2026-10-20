import type { Balance } from "./api";
import { Avatar } from "./Avatar";
import { formatear, nombreMoneda } from "./formato";

/**
 * Compara lo que puso cada persona con lo que le tocaba, para ver de un vistazo
 * quién puso de más y quién puso de menos. Cada moneda se grafica por separado.
 */
export function Graficos({ balances }: { balances: Balance[] }) {
  const porMoneda = [...new Set(balances.map((b) => b.moneda))]
    .map((moneda) => ({
      moneda,
      balances: balances.filter((b) => b.moneda === moneda),
    }))
    .filter(({ balances: delGrupo }) => delGrupo.some((b) => b.pagado > 0));

  return (
    <>
      {porMoneda.map(({ moneda, balances: delGrupo }) => {
        const total = delGrupo.reduce((acc, b) => acc + b.pagado, 0);
        const promedio = total / delGrupo.length;
        const maximo = Math.max(...delGrupo.flatMap((b) => [b.pagado, b.corresponde]));

        const ancho = (valor: number) => {
          if (maximo <= 0 || valor <= 0) return 0;
          return Math.max((valor / maximo) * 100, 2);
        };

        return (
          <section className="card" key={moneda}>
            <h3>
              Cómo se reparte
              {porMoneda.length > 1 ? ` · ${nombreMoneda(moneda)}` : ""}
            </h3>

            <div className="stats">
              <div>
                <span className="stat">{formatear(total, moneda)}</span>
                <span className="muted">Total gastado</span>
              </div>
              <div>
                <span className="stat">{formatear(promedio, moneda)}</span>
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
              {delGrupo.map((b) => (
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
                      <span className="barra-valor">{formatear(b.pagado, moneda)}</span>
                    </div>
                    <div className="barra-linea">
                      <div className="barra-track">
                        <div className="barra tocaba" style={{ width: `${ancho(b.corresponde)}%` }} />
                      </div>
                      <span className="barra-valor">{formatear(b.corresponde, moneda)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
