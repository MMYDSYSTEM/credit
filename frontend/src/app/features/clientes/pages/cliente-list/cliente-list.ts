import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Plus } from '@primeicons/angular/plus';
import { Wallet } from '@primeicons/angular/wallet';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { catchError, of, tap } from 'rxjs';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente.service';

/** Minúsculas y sin acentos, para comparar "Gómez" con "gomez". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function coincide(cliente: Cliente, terminos: string[]): boolean {
  const nombreCompleto = normalizar(`${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`);
  return terminos.every(termino => nombreCompleto.includes(termino));
}

@Component({
  selector: 'app-cliente-list',
  imports: [TableModule, InputText, ButtonDirective, RouterLink, Wallet, Plus],
  templateUrl: './cliente-list.html',
})
export class ClienteList {
  private readonly clienteService = inject(ClienteService);

  /** Mensaje que deja "Generar Préstamo" al navegar aquí (p. ej. "Préstamo 03 generado para…"). */
  protected readonly mensaje = signal<string | null>(
    (inject(Router).currentNavigation()?.extras.state?.['mensaje'] as string | undefined) ?? null,
  );

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly clientes = toSignal(
    this.clienteService.getAll().pipe(
      tap(() => this.cargando.set(false)),
      catchError(() => {
        this.cargando.set(false);
        this.error.set('No se pudo cargar la lista de clientes.');
        return of([] as Cliente[]);
      }),
    ),
    { initialValue: [] },
  );

  protected readonly busqueda = signal('');
  protected readonly primeraFila = signal(0);

  protected readonly clientesFiltrados = computed(() => {
    const terminos = normalizar(this.busqueda()).split(/\s+/).filter(Boolean);
    return terminos.length ? this.clientes().filter(c => coincide(c, terminos)) : this.clientes();
  });

  protected onBuscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
    this.primeraFila.set(0); // volver a la página 1 al filtrar
  }
}
