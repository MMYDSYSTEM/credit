import { FormControl } from '@angular/forms';
import { PATRON_NOMBRE, entero, noVacio } from './prestamo.validadores';

describe('prestamo.validadores', () => {
  it('PATRON_NOMBRE acepta acentos, ñ, espacios, guion y apóstrofo', () => {
    expect(PATRON_NOMBRE.test('José María')).toBe(true);
    expect(PATRON_NOMBRE.test('Peña-Núñez')).toBe(true);
    expect(PATRON_NOMBRE.test("O'Brien")).toBe(true);
    expect(PATRON_NOMBRE.test('Ana2')).toBe(false);
    expect(PATRON_NOMBRE.test(' Ana')).toBe(false);
  });

  it('noVacio rechaza texto vacío o solo con espacios', () => {
    expect(noVacio(new FormControl('   '))).toEqual({ required: true });
    expect(noVacio(new FormControl('Ana'))).toBeNull();
  });

  it('entero acepta null y enteros, rechaza decimales', () => {
    expect(entero(new FormControl(null))).toBeNull();
    expect(entero(new FormControl(4))).toBeNull();
    expect(entero(new FormControl(4.5))).toEqual({ entero: true });
  });
});
