import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'eligo-sidebar-section',
  imports: [DividerModule],
  template: `
    <div class="w-120p -mx-4">
      <p-divider align="left">
      <ng-content select="[header]" />
    </p-divider>
    </div>
    <div class="flex flex-col gap-2">
        <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSection {}
