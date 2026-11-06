import { environment } from '../../../../environments/environment';

/** URL de /api/prestamos (o de un préstamo si se pasa el id). Con apiUrl vacío se usan rutas relativas. */
export function prestamosUrl(id?: string): string {
  const base = `${environment.apiUrl}/api/prestamos`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

/** URL de /api/clientes/{id}/prestamos. */
export function prestamosDeClienteUrl(clienteId: string): string {
  return `${environment.apiUrl}/api/clientes/${encodeURIComponent(clienteId)}/prestamos`;
}
