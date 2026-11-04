using Credit.Domain.Common;

namespace Credit.Domain.Prestamos;

public sealed class Prestamo : AggregateRoot
{
    private Prestamo(Guid id) : base(id) { }

    // Requerido por EF Core
    private Prestamo() { }

    public static Prestamo Crear()
    {
        return new Prestamo(Guid.CreateVersion7());
    }
}
