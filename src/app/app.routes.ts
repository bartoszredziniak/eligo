import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/configurator/configurator.routes').then(m => m.CONFIGURATOR_ROUTES)
  }
];
