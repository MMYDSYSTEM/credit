using Credit.Application.Usuarios.ListarUsuarios;
using Microsoft.Extensions.DependencyInjection;

namespace Credit.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ListarUsuariosHandler>();
        return services;
    }
}
