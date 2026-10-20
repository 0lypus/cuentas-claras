namespace CuentasClaras.Api.Dtos;

public record CrearGrupoRequest(string Nombre);
public record AgregarMiembroRequest(string Nombre);

/// <param name="ModoReparto">"igual" (o ausente), "porcentaje" o "montos".</param>
/// <param name="Reparto">Un valor por participante: porcentaje (deben sumar 100) o monto fijo (debe sumar el monto).</param>
/// <param name="Moneda">"ARS" (o ausente) o "USD". Cada moneda se compensa por separado.</param>
public record CrearGastoRequest(
    string Descripcion,
    decimal Monto,
    int PagadoPorId,
    List<int> ParticipantesIds,
    string? ModoReparto = null,
    List<ValorRepartoRequest>? Reparto = null,
    string? Moneda = null);

public record ValorRepartoRequest(int MiembroId, decimal Valor);

public record MiembroDto(int Id, string Nombre);
public record GrupoDto(int Id, string Nombre, string CodigoInvitacion, List<MiembroDto> Miembros);
public record GastoDto(int Id, string Descripcion, decimal Monto, string Moneda, string PagadoPor, DateTime Fecha);

public record RepartoDetalleDto(string Nombre, decimal Monto);

public record GastoListadoDto(
    int Id,
    string Descripcion,
    decimal Monto,
    string Moneda,
    string PagadoPor,
    List<string> Participantes,
    DateTime Fecha,
    List<RepartoDetalleDto> Reparto);
