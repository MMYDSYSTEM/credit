using Credit.Application.Usuarios.ListarUsuarios;
using Credit.Domain.Usuarios;
using Credit.Domain.ValueObjects;

namespace Credit.Infrastructure.Queries;

internal sealed class UsuarioQueriesEnMemoria : IUsuarioQueries
{
    private readonly List<Usuario> _usuarios =
    [
        Usuario.Crear("Ana",   "Pérez", "Ruiz",      Email.Crear("ana.perez@credit.com")),
        Usuario.Crear("Luis",  "Gómez", null,        Email.Crear("luis.gomez@credit.com")),
        Usuario.Crear("María", "López", "Hernández", Email.Crear("maria.lopez@credit.com"))
    ];

    public Task<IReadOnlyList<UsuarioDto>> ListarAsync(CancellationToken ct)
        => Task.FromResult<IReadOnlyList<UsuarioDto>>(
            _usuarios.Select(u => new UsuarioDto(
                u.Id, u.Nombre, u.ApellidoPaterno, u.ApellidoMaterno, u.Email.Valor)).ToList());
}
