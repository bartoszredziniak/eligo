import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'eligo-sidebar-section',
  imports: [],
  template: `
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-3">
        <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-widest m-0">
          <ng-content select="[header]" />
        </h4>
        <div class="h-px bg-border grow"></div>
      </div>
      <div class="flex flex-col gap-4">
          <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSection {}