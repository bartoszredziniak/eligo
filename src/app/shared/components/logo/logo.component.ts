import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-3 select-none">
      <!-- Icon Wrapper -->
      <div class="text-primary flex items-center justify-center transition-transform hover:scale-105" 
           [class]="iconSizeClass">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          class="w-full h-full"
          aria-label="Eligo Logo"
          role="img"
        >
          <g transform="translate(15,15) scale(0.7)">
             <!-- Refined Stack -->
             <rect x="0" y="5" width="100" height="26" rx="4" fill="currentColor" class="origin-center transition-all" />
             <rect x="0" y="37" width="75" height="26" rx="4" fill="currentColor" class="origin-center transition-all" />
             <rect x="0" y="69" width="100" height="26" rx="4" fill="currentColor" class="origin-center transition-all" />
          </g>
        </svg>
      </div>

      <!-- Text -->
      @if (showText()) {
        <span 
          class="font-bold tracking-tight text-foreground"
          [class]="textSizeClass"
        >
          Eligo
        </span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  showText = input(true);
  
  // Size classes
  size = input<'small' | 'medium' | 'large'>('medium');

  protected get iconSizeClass(): string {
    switch (this.size()) {
      case 'small': return 'w-8 h-8';   // Compact
      case 'large': return 'w-16 h-16'; // Welcome screen
      default: return 'w-9 h-9';        // Default (Header)
    }
  }

  protected get textSizeClass(): string {
    switch (this.size()) {
      case 'small': return 'text-xl';
      case 'large': return 'text-4xl';
      default: return 'text-2xl';
    }
  }
}