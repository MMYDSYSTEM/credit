/** Respuesta de GET /api/clientes/{id}/prestamos. */

export type EstadoPrestamo = 'ACTIVO' | 'LIQUIDADO';

export interface PrestamoResumenDto {
  id: string;
  folio: string;
  monto: number;
  pago: number;
  plazo: number;
  fechaEntrega: string; // yyyy-MM-dd
  fechaTermino: string; // yyyy-MM-dd
  estado: EstadoPrestamo;
}

export interface PrestamosDeClienteDto {
  cliente: { id: string; nombreCompleto: string };
  prestamos: PrestamoResumenDto[];
}
