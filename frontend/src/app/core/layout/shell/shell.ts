import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly menuAbierto = signal(false);

  protected readonly navItems: NavItem[] = [
    { label: 'Clientes', route: '/clientes' },
    { label: 'Registrar Préstamo', route: '/prestamos/registrar' },
  ];

  protected toggleMenu(): void {
    this.menuAbierto.update(abierto => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }
}
