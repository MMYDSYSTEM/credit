using Credit.Application.Usuarios.ListarUsuarios;
using Microsoft.AspNetCore.Mvc;

namespace Credit.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
public sealed class UsuariosController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UsuarioDto>>> Listar(
        [FromServices] ListarUsuariosHandler handler, CancellationToken ct)
        => Ok(await handler.Handle(ct));
}
