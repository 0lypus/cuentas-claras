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

    [HttpPost("{codigo}/gastos")]
    public async Task<ActionResult<GastoDto>> AgregarGasto(string codigo, CrearGastoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Descripcion))
            return BadRequest("La descripción es obligatoria.");
        if (req.Monto <= 0)
            return BadRequest("El monto debe ser mayor a 0.");
        if (req.ParticipantesIds is null || req.ParticipantesIds.Count == 0)
            return BadRequest("Tiene que haber al menos un participante.");

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

        var gasto = new GastoRegistrado
        {
            Descripcion = req.Descripcion.Trim(),
            Monto = Math.Round(req.Monto, 2),
            PagadoPor = pagador,
            Participantes = participantes
        };
        grupo.Gastos.Add(gasto);
        await db.SaveChangesAsync();

        return Ok(new GastoDto(gasto.Id, gasto.Descripcion, gasto.Monto, pagador.Nombre, gasto.Fecha));
    }

    [HttpGet("{codigo}/saldos")]
    public async Task<ActionResult<List<Transferencia>>> Saldos(string codigo)
    {
        var grupo = await db.Grupos
            .AsNoTracking()
            .AsSplitQuery()
            .Include(g => g.Gastos).ThenInclude(x => x.PagadoPor)
            .Include(g => g.Gastos).ThenInclude(x => x.Participantes)
            .FirstOrDefaultAsync(g => g.CodigoInvitacion == codigo);
        if (grupo is null) return NotFound();

        var gastos = grupo.Gastos.Select(x => new Gasto(
            x.PagadoPor.Nombre,
            x.Monto,
            x.Participantes.Select(p => p.Nombre).ToList()));

        return SimplificadorDeDeudas.Calcular(gastos);
    }

    private static GrupoDto ToDto(Grupo g) => new(
        g.Id,
        g.Nombre,
        g.CodigoInvitacion,
        g.Miembros.Select(m => new MiembroDto(m.Id, m.Nombre)).ToList());
}