import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      class="w-full h-full"
      aria-label="Eligo Logo"
      role="img"
    >
      <g transform="translate(15,15) scale(0.7)">
         <!-- Refined Stack: The Final Identity -->
         <rect x="0" y="5" width="100" height="26" rx="4" [attr.fill]="color()" class="origin-center transition-all" />
         <rect x="0" y="37" width="75" height="26" rx="4" [attr.fill]="color()" class="origin-center transition-all" />
         <rect x="0" y="69" width="100" height="26" rx="4" [attr.fill]="color()" class="origin-center transition-all" />
      </g>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-block;
      line-height: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  animated = input(false);
  color = input('currentColor');
}