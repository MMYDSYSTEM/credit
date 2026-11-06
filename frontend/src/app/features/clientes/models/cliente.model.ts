export interface Cliente {
  id: string; // no se muestra, pero identifica al cliente
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null; // opcional
  /** Número de préstamos que ha tenido el cliente. */
  prestamos: number;
  /** Préstamo activo del cliente (lo decide el backend); null si no tiene. */
  prestamoActivo: { id: string; folio: string } | null;
}
