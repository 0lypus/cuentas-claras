using CuentasClaras.Api.Dtos;
using CuentasClaras.Core.Entities;
using CuentasClaras.Core.Models;
using CuentasClaras.Core.Services;
using CuentasClaras.Infra;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CuentasClaras.Api.Controllers;

[ApiController]
[Route("api/grupos")]
public class GruposController(CuentasClarasDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<GrupoDto>> Crear(CrearGrupoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return BadRequest("El nombre del grupo es obligatorio.");

        var grupo = new Grupo { Nombre = req.Nombre.Trim() };
        db.Grupos.Add(grupo);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Obtener), new { codigo = grupo.CodigoInvitacion }, ToDto(grupo));
    }

    [HttpGet("{codigo}")]
    public async Task<ActionResult<GrupoDto>> Obtener(string codigo)
    {
        var grupo = await db.Grupos
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.CodigoInvitacion == codigo);

        return grupo is null ? NotFound() : ToDto(grupo);
    }

    [HttpPost("{codigo}/miembros")]
    public async Task<ActionResult<MiembroDto>> AgregarMiembro(string codigo, AgregarMiembroRequest req)
    {
        var nombre = req.Nombre?.Trim();
        if (string.IsNullOrEmpty(nombre))
            return BadRequest("El nombre es obligatorio.");

        var grupo = await db.Grupos
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.CodigoInvitacion == codigo);
        if (grupo is null) return NotFound();

        // El algoritmo identifica a las personas por nombre, así que no puede haber repetidos
        if (grupo.Miembros.Any(m => m.Nombre.Equals(nombre, StringComparison.OrdinalIgnoreCase)))
            return Conflict("Ya hay un miembro con ese nombre en el grupo.");

        var miembro = new Miembro { Nombre = nombre };
        grupo.Miembros.Add(miembro);
        await db.SaveChangesAsync();

        return Ok(new MiembroDto(miembro.Id, miembro.Nombre));
    }


    [HttpGet("{codigo}/gastos")]
    public async Task<ActionResult<List<GastoListadoDto>>> ListarGastos(string codigo)
    {
        var grupo = await db.Grupos.AsNoTracking()
            .FirstOrDefaultAsync(g => g.CodigoInvitacion == codigo);
        if (grupo is null) return NotFound();

        var gastos = await db.Gastos
            .AsNoTracking()
            .AsSplitQuery()
            .Include(g => g.PagadoPor)
            .Include(g => g.Participantes)
            .Include(g => g.Reparto).ThenInclude(d => d.Miembro)
            .Where(g => g.GrupoId == grupo.Id)
            .OrderByDescending(g => g.Id)
            .ToListAsync();

        return gastos
            .Select(g => new GastoListadoDto(
                g.Id,
                g.Descripcion,
                g.Monto,
                g.Moneda,
                g.PagadoPor.Nombre,
                g.Participantes.Select(p => p.Nombre).ToList(),
                g.Fecha,
                g.Reparto.Select(d => new RepartoDetalleDto(d.Miembro.Nombre, d.Monto)).ToList()))
            .ToList();
    }

    [HttpDelete("{codigo}/gastos/{id:int}")]
    public async Task<IActionResult> EliminarGasto(string codigo, int id)
    {
        var gasto = await db.Gastos
            .FirstOrDefaultAsync(g => g.Id == id && g.Grupo.CodigoInvitacion == codigo);
        if (gasto is null) return NotFound();

        db.Gastos.Remove(gasto);
        await db.SaveChangesAsync();
        return NoContent();
    }



    [HttpPost("{codigo}/gastos")]
    public async Task<ActionResult<GastoDto>> AgregarGasto(string codigo, CrearGastoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Descripcion))
            return BadRequest("La descripción es obligatoria.");

        var monto = Math.Round(req.Monto, 2);
        if (monto <= 0)
            return BadRequest("El monto debe ser mayor a 0.");
        if (req.ParticipantesIds is null || req.ParticipantesIds.Count == 0)
            return BadRequest("Tiene que haber al menos un participante.");

        var modo = (req.ModoReparto ?? "igual").Trim().ToLowerInvariant();
        if (modo is not ("igual" or "porcentaje" or "montos"))
            return BadRequest("El modo de reparto tiene que ser \"igual\", \"porcentaje\" o \"montos\".");

        var moneda = Monedas.Normalizar(req.Moneda);
        if (!Monedas.EsSoportada(moneda))
            return BadRequest("La moneda tiene que ser ARS o USD.");

        var grupo = await db.Grupos
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.CodigoInvitacion == codigo);
        if (grupo is null) return NotFound();

        var pagador = grupo.Miembros.FirstOrDefault(m => m.Id == req.PagadoPorId);
        if (pagador is null)
            return BadRequest("El pagador no pertenece al grupo.");

        var ids = req.ParticipantesIds.Distinct().ToList();
        var participantes = grupo.Miembros.Where(m => ids.Contains(m.Id)).ToList();
        if (participantes.Count != ids.Count)
            return BadRequest("Hay participantes que no pertenecen al grupo.");

        List<decimal>? montos = null;
        if (modo != "igual")
        {
            var valores = req.Reparto ?? [];
            var idsReparto = valores.Select(v => v.MiembroId).Distinct().ToList();
            if (idsReparto.Count != valores.Count || idsReparto.Count != participantes.Count || !idsReparto.All(ids.Contains))
                return BadRequest("El reparto tiene que incluir un valor por cada participante.");

            // Se respeta el orden de los participantes del grupo para que el resultado sea estable
            var porParticipante = participantes
                .Select(p => valores.First(v => v.MiembroId == p.Id).Valor)
                .ToList();

            try
            {
                montos = modo == "porcentaje"
                    ? RepartoDeGastos.PorPorcentaje(monto, porParticipante)
                    : RepartoDeGastos.MontosFijos(monto, porParticipante);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        var gasto = new GastoRegistrado
        {
            Descripcion = req.Descripcion.Trim(),
            Monto = monto,
            Moneda = moneda,
            PagadoPor = pagador,
            Participantes = participantes
        };

        if (montos is not null)
        {
            for (var i = 0; i < participantes.Count; i++)
                gasto.Reparto.Add(new DetalleReparto { Miembro = participantes[i], Monto = montos[i] });
        }

        grupo.Gastos.Add(gasto);
        await db.SaveChangesAsync();

        return Ok(new GastoDto(gasto.Id, gasto.Descripcion, gasto.Monto, gasto.Moneda, pagador.Nombre, gasto.Fecha));
    }

    [HttpGet("{codigo}/saldos")]
    public async Task<ActionResult<List<Transferencia>>> Saldos(string codigo)
    {
        var grupo = await db.Grupos
            .AsNoTracking()
            .AsSplitQuery()
            .Include(g => g.Gastos).ThenInclude(x => x.PagadoPor)
            .Include(g => g.Gastos).ThenInclude(x => x.Participantes)
            .Include(g => g.Gastos).ThenInclude(x => x.Reparto).ThenInclude(d => d.Miembro)
            .FirstOrDefaultAsync(g => g.CodigoInvitacion == codigo);
        if (grupo is null) return NotFound();

        return SimplificadorDeDeudas.Calcular(grupo.Gastos.Select(ADominio));
    }


    [HttpGet("{codigo}/balances")]
    public async Task<ActionResult<List<Balance>>> Balances(string codigo)
    {
        var grupo = await db.Grupos
            .AsNoTracking()
            .AsSplitQuery()
            .Include(g => g.Miembros)
            .Include(g => g.Gastos).ThenInclude(x => x.PagadoPor)
            .Include(g => g.Gastos).ThenInclude(x => x.Participantes)
            .Include(g => g.Gastos).ThenInclude(x => x.Reparto).ThenInclude(d => d.Miembro)
            .FirstOrDefaultAsync(g => g.CodigoInvitacion == codigo);
        if (grupo is null) return NotFound();

        return SimplificadorDeDeudas.CalcularBalances(
            grupo.Gastos.Select(ADominio),
            grupo.Miembros.Select(m => m.Nombre));
    }

    private static Gasto ADominio(GastoRegistrado g) => new(
        g.PagadoPor.Nombre,
        g.Monto,
        g.Participantes.Select(p => p.Nombre).ToList(),
        g.Reparto.Count == 0
            ? null
            : g.Reparto.ToDictionary(d => d.Miembro.Nombre, d => d.Monto),
        g.Moneda);

    private static GrupoDto ToDto(Grupo g) => new(
        g.Id,
        g.Nombre,
        g.CodigoInvitacion,
        g.Miembros.Select(m => new MiembroDto(m.Id, m.Nombre)).ToList());
}