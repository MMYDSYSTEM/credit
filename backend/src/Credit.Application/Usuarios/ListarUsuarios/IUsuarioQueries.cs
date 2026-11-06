namespace Credit.Application.Usuarios.ListarUsuarios;

public interface IUsuarioQueries
{
    Task<IReadOnlyList<UsuarioDto>> ListarAsync(CancellationToken ct);
}
