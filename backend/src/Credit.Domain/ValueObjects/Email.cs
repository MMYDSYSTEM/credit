using System.Net.Mail;

namespace Credit.Domain.ValueObjects;

public sealed record Email
{
    public const int LongitudMaxima = 254;

    public string Valor { get; }

    private Email(string valor) => Valor = valor;

    public static Email Crear(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            throw new ArgumentException("El email es obligatorio.", nameof(valor));

        var normalizado = valor.Trim().ToLowerInvariant();

        if (normalizado.Length > LongitudMaxima)
            throw new ArgumentException($"El email no puede superar {LongitudMaxima} caracteres.", nameof(valor));

        // TryCreate también acepta "Nombre <x@y.com>"; se exige que sea solo la dirección
        if (!MailAddress.TryCreate(normalizado, out var direccion) || direccion.Address != normalizado)
            throw new ArgumentException("El email no tiene un formato válido.", nameof(valor));

        return new Email(normalizado);
    }

    public override string ToString() => Valor;
}
