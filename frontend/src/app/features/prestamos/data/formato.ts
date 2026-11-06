/* Lo usan las tres pantallas de préstamos. */

/** 'yyyy-MM-dd' → 'dd/MM/yyyy' partiendo el texto, sin new Date() (evita el desfase de zona horaria). */
export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
}
