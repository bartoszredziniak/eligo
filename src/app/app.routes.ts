import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/welcome/welcome.routes').then((m) => m.WELCOME_ROUTES),
  },
  {
    path: 'configurator',
    loadChildren: () =>
      import('./features/configurator/configurator.routes').then((m) => m.CONFIGURATOR_ROUTES),
  },
];
