namespace Credit.Application.Usuarios.ListarUsuarios;

public sealed class ListarUsuariosHandler(IUsuarioQueries queries)
{
    public Task<IReadOnlyList<UsuarioDto>> Handle(CancellationToken ct) => queries.ListarAsync(ct);
}
