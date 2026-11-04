namespace Credit.Domain.Common;

public abstract class AggregateRoot : Entity
{
    protected AggregateRoot(Guid id) : base(id) { }

    // Requerido por EF Core
    protected AggregateRoot() { }
}
