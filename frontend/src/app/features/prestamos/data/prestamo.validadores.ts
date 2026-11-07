import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { calcularPlazoDiario } from './prestamo.calculos';

/*
 * Validaciones previas a guardar. El backend vuelve a validar todo; estas evitan
 * enviar datos que de antemano sabemos que son incorrectos.
 */

/** Letras (con acentos y ñ), espacios, guion y apóstrofo; debe empezar con letra. */
export const PATRON_NOMBRE = /^\p{L}[\p{L}\s'-]*$/u;

export const MAX_NOMBRE = 60;

/** Rechaza texto vacío o solo con espacios. */
export const noVacio: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: true };

/** Número entero (null pasa: de eso se encarga Validators.required). */
export const entero: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value === null || Number.isInteger(control.value) ? null : { entero: true };

/**
 * Validador de grupo: la fecha `fin` no puede ser anterior a `inicio` (texto 'yyyy-MM-dd').
 * Si falta alguna, pasa: de eso se encarga Validators.required.
 */
export function rangoFechas(inicio: string, fin: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const desde = grupo.get(inicio)?.value as string | null;
    const hasta = grupo.get(fin)?.value as string | null;
    return desde && hasta && hasta < desde ? { rangoFechas: true } : null;
  };
}

/**
 * Validador de grupo del préstamo diario: entre `inicio` y `fin` debe haber al menos un día de cobro
 * (un rango con solo domingos no tiene pagos). Si faltan fechas o están invertidas, pasa: de eso se
 * encargan Validators.required y rangoFechas.
 */
export function conDiasDeCobro(inicio: string, fin: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const desde = grupo.get(inicio)?.value as string | null;
    const hasta = grupo.get(fin)?.value as string | null;
    if (!desde || !hasta || hasta < desde) {
      return null;
    }
    return calcularPlazoDiario(desde, hasta) === null ? { sinDiasDeCobro: true } : null;
  };
}
