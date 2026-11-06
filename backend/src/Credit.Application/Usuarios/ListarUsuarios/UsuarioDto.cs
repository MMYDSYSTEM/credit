namespace Credit.Application.Usuarios.ListarUsuarios;

public sealed record UsuarioDto(
    Guid Id,
    string Nombre,
    string ApellidoPaterno,
    string? ApellidoMaterno,
    string Email);
