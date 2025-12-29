import {Component, inject,} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {PosthogService} from './core/observability/posthog.service';

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
  private postHog = inject(PosthogService)
}
