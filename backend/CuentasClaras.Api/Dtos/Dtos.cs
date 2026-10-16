namespace CuentasClaras.Api.Dtos;

public record CrearGrupoRequest(string Nombre);
public record AgregarMiembroRequest(string Nombre);
public record CrearGastoRequest(string Descripcion, decimal Monto, int PagadoPorId, List<int> ParticipantesIds);

public record MiembroDto(int Id, string Nombre);
public record GrupoDto(int Id, string Nombre, string CodigoInvitacion, List<MiembroDto> Miembros);
public record GastoDto(int Id, string Descripcion, decimal Monto, string PagadoPor, DateTime Fecha);