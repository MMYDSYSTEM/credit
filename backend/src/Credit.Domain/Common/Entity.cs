namespace Credit.Domain.Common;

public abstract class Entity<TId> : IEquatable<Entity<TId>> where TId : notnull
{
    public TId Id { get; protected set; } = default!;

    protected Entity(TId id) => Id = id;

    // Requerido por EF Core
    protected Entity() { }

    // Con Id int, la entidad es "transitoria" (Id = 0) hasta guardarse en la BD, se puede sustituir por = Id is default;
    private bool EsTransitoria => EqualityComparer<TId>.Default.Equals(Id, default!);

    public bool Equals(Entity<TId>? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true; //Previene que 2 objetos sean iguales al no compartir el mismo espacio de memoria o la misma instancia
        if (GetType() != other.GetType()) return false;
        if (EsTransitoria || other.EsTransitoria) return false;

        return EqualityComparer<TId>.Default.Equals(Id, other.Id);
    }

    public override bool Equals(object? obj) => Equals(obj as Entity<TId>);

    public override int GetHashCode() => EqualityComparer<TId>.Default.GetHashCode(Id);

    public static bool operator ==(Entity<TId>? left, Entity<TId>? right) => Equals(left, right);

    public static bool operator !=(Entity<TId>? left, Entity<TId>? right) => !Equals(left, right);
}
