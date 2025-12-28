import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eligo-empty-state',
  imports: [CommonModule],
  template: `
    @if (mini()) {
      <!-- Mini mode: compact layout for sidebars -->
      <div class="flex flex-col items-center justify-center py-3 px-2 text-center">
        @if (icon()) {
          <i [class]="'pi ' + icon() + ' text-muted-foreground text-lg mb-2'"></i>
        }
        @if (header()) {
          <div class="text-xs font-medium text-foreground mb-0.5">{{ header() }}</div>
        }
        @if (description()) {
          <div class="text-xs text-muted-foreground">{{ description() }}</div>
        }
      </div>
    } @else {
      <!-- Standard mode: larger layout for main content areas -->
      <div class="flex flex-col items-center justify-center py-8 px-4 text-center">
        @if (icon()) {
          <i [class]="'pi ' + icon() + ' text-muted-foreground opacity-50 text-5xl mb-4'"></i>
        }
        @if (header()) {
          <div class="text-lg font-semibold text-foreground mb-2">{{ header() }}</div>
        }
        @if (description()) {
          <div class="text-sm text-muted-foreground max-w-sm">{{ description() }}</div>
        }
      </div>
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  icon = input<string>();
  header = input<string>();
  description = input<string>();
  mini = input<boolean>(false);
}
