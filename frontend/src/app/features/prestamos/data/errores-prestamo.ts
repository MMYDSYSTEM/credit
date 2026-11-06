import { HttpErrorResponse } from '@angular/common/http';

/* Lo usan las tres pantallas de préstamos. */

const MENSAJES: Record<string, string> = {
  CLIENTE_EMAIL_DUPLICADO: 'Ya existe un cliente con ese email.',
  CONDICIONES_INVALIDAS: 'Las condiciones del préstamo no son válidas. Revisa los datos.',
  CLIENTE_NO_ENCONTRADO: 'No se encontró el cliente.',
  PRESTAMO_NO_ENCONTRADO: 'No se encontró el préstamo.',
  PRESTAMO_ACTIVO_EXISTENTE: 'El cliente ya tiene un préstamo activo. No se puede generar otro hasta liquidarlo.',
};

/** Traduce el { code } que devuelve el backend a un mensaje para el usuario. */
export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const code = (error.error as { code?: unknown } | null)?.code;
    if (typeof code === 'string' && MENSAJES[code]) {
      return MENSAJES[code];
    }
    if (error.status === 404) {
      return 'No se encontró la información solicitada.';
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
