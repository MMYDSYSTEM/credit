using Credit.Domain.Common;
using Credit.Domain.ValueObjects;

namespace Credit.Domain.Usuarios;

public sealed class Usuario : AggregateRoot<Guid>
{
    public string Nombre { get; private set; } = null!;
    public string ApellidoPaterno { get; private set; } = null!;
    public string? ApellidoMaterno { get; private set; }
    public Email Email { get; private set; } = null!;

    private Usuario(Guid id, string nombre, string apellidoPaterno, string? apellidoMaterno, Email email)
        : base(id)
    {
        Nombre = nombre;
        ApellidoPaterno = apellidoPaterno;
        ApellidoMaterno = apellidoMaterno;
        Email = email;
    }

    // Requerido por EF Core
    private Usuario() { }

    public static Usuario Crear(string nombre, string apellidoPaterno, string? apellidoMaterno, Email email)
    {
        ArgumentNullException.ThrowIfNull(email);

        return new Usuario(
            Guid.CreateVersion7(),
            Requerido(nombre, nameof(nombre)),
            Requerido(apellidoPaterno, nameof(apellidoPaterno)),
            Opcional(apellidoMaterno),
            email);
    }

    private static string Requerido(string valor, string campo)
        => string.IsNullOrWhiteSpace(valor)
            ? throw new ArgumentException($"El campo {campo} es obligatorio.", campo)
            : valor.Trim();

    // Un texto vacío o con solo espacios se guarda como null
    private static string? Opcional(string? valor)
        => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
}
