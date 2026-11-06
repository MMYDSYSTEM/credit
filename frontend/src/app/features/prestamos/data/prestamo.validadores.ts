import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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
