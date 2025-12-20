import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'eligo-sidebar-section',
  imports: [DividerModule],
  template: `
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-3">
        <h4 class="text-xs font-semibold text-surface-500 uppercase tracking-widest m-0">
          <ng-content select="[header]" />
        </h4>
        <div class="h-px bg-surface-200 grow"></div>
      </div>
      <div class="flex flex-col gap-4">
          <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSection {}
