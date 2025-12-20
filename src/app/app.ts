import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'eligo-root',
  imports: [RouterOutlet, ButtonModule, ConfirmDialog],
  template: `
    <router-outlet />
    <p-confirmdialog />
  `,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('eligo');
}
