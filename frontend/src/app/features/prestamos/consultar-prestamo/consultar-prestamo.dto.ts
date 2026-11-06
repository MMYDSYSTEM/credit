/** Respuesta de GET /api/prestamos/{id}. */

export type EstadoPrestamo = 'ACTIVO' | 'LIQUIDADO';

export type EstadoAmortizacion = 'PAGADA' | 'PENDIENTE' | 'VENCIDA';

export interface ClientePrestamoDto {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null;
}

export interface CondicionesPrestamoDto {
  monto: number;
  tasaMensual: number;
  diaPago: string;
  pago: number;
  plazo: number;
  meses: number;
  fechaEntrega: string; // yyyy-MM-dd
  fechaInicio: string; // yyyy-MM-dd
  fechaTermino: string; // yyyy-MM-dd
}

export interface TotalesPrestamoDto {
  capital: number;
  interes: number;
  gastos: number;
  total: number;
}

export interface AmortizacionPrestamoDto {
  numero: number;
  fechaVencimiento: string; // yyyy-MM-dd
  capital: number;
  interes: number;
  gastos: number;
  estado: EstadoAmortizacion;
}

export interface PrestamoDto {
  id: string;
  folio: string;
  estado: EstadoPrestamo;
  cliente: ClientePrestamoDto;
  condiciones: CondicionesPrestamoDto;
  totales: TotalesPrestamoDto;
  amortizaciones: AmortizacionPrestamoDto[];
}
