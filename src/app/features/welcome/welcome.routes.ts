import { Routes } from '@angular/router';
import { WelcomeLayoutComponent } from './containers/welcome-layout/welcome-layout.component';
import { WelcomeStartComponent } from './components/welcome-start/welcome-start.component';
import { WelcomeDimensionsComponent } from './components/welcome-dimensions/welcome-dimensions.component';
import { WelcomeTemplatesComponent } from './components/welcome-templates/welcome-templates.component';

export const WELCOME_ROUTES: Routes = [
  {
    path: '',
    component: WelcomeLayoutComponent,
    children: [
      {
        path: '',
        component: WelcomeStartComponent,
      },
      {
        path: 'dimensions',
        component: WelcomeDimensionsComponent,
      },
      {
        path: 'templates',
        component: WelcomeTemplatesComponent,
      },
    ],
  },
];
