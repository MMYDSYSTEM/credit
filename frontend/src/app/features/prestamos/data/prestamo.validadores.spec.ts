import { FormControl, FormGroup } from '@angular/forms';
import { PATRON_NOMBRE, conDiasDeCobro, entero, noVacio, rangoFechas } from './prestamo.validadores';

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

  it('rangoFechas rechaza un fin anterior al inicio; con fechas vacías pasa', () => {
    const grupo = (inicio: string, fin: string) =>
      new FormGroup({ inicio: new FormControl(inicio), fin: new FormControl(fin) });
    const validar = rangoFechas('inicio', 'fin');
    expect(validar(grupo('2026-11-10', '2026-11-09'))).toEqual({ rangoFechas: true });
    expect(validar(grupo('2026-11-10', '2026-11-10'))).toBeNull();
    expect(validar(grupo('2026-11-10', ''))).toBeNull();
  });

  it('conDiasDeCobro rechaza un rango que solo tiene domingos', () => {
    const grupo = (inicio: string, fin: string) =>
      new FormGroup({ inicio: new FormControl(inicio), fin: new FormControl(fin) });
    const validar = conDiasDeCobro('inicio', 'fin');
    expect(validar(grupo('2026-11-15', '2026-11-15'))).toEqual({ sinDiasDeCobro: true }); // domingo
    expect(validar(grupo('2026-11-15', '2026-11-16'))).toBeNull(); // domingo y lunes
    expect(validar(grupo('2026-11-16', '2026-11-15'))).toBeNull(); // invertidas: lo marca rangoFechas
  });
});
