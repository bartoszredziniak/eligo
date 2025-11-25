import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'eligo-ui-header',
  imports: [CommonModule, ToolbarModule],
  template: `
    <p-toolbar styleClass="border-none border-b border-gray-200 rounded-none px-4 py-2 bg-white">
      <div class="p-toolbar-group-start">
        <ng-content select="[start]" />
      </div>

      <div class="p-toolbar-group-end">
        <ng-content select="[end]" />
      </div>
    </p-toolbar>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiHeader {}
