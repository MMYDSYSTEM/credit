/** Cuerpo y respuesta de POST /api/prestamos: crea el cliente junto con su préstamo. */

export interface ClienteNuevoDto {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null; // opcional
}

export interface CondicionesPrestamoDto {
  monto: number;
  tasaMensual: number;
  diaPago: string;
  pago: number; // pago semanal
  plazo: number; // número de pagos semanales
  meses: number;
  fechaEntrega: string; // yyyy-MM-dd
  fechaInicio: string; // yyyy-MM-dd
  fechaTermino: string; // yyyy-MM-dd
}

/** Cliente nuevo: se crea junto con el préstamo. */
export interface RegistrarPrestamoClienteNuevoDto {
  cliente: ClienteNuevoDto;
  condiciones: CondicionesPrestamoDto;
}

/** Cliente existente: el backend rechaza el alta si ya tiene un préstamo activo. */
export interface RegistrarPrestamoClienteExistenteDto {
  clienteId: string;
  condiciones: CondicionesPrestamoDto;
}

export type RegistrarPrestamoDto = RegistrarPrestamoClienteNuevoDto | RegistrarPrestamoClienteExistenteDto;

/** Respuesta de GET /api/clientes/{id}. */
export interface ClienteExistenteDto {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null;
  prestamoActivo: { id: string; folio: string } | null;
}

export interface PrestamoRegistradoDto {
  id: string;
  folio: string;
  clienteId: string;
}
