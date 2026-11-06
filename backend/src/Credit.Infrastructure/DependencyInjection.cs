using Credit.Application.Usuarios.ListarUsuarios;
using Credit.Infrastructure.Queries;
using Microsoft.Extensions.DependencyInjection;

namespace Credit.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // Singleton para que los datos en memoria no cambien entre requests
        services.AddSingleton<IUsuarioQueries, UsuarioQueriesEnMemoria>();
        return services;
    }
}
