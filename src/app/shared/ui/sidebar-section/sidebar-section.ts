import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'eligo-sidebar-section',
  imports: [AccordionModule],
  template: `
    <p-accordion [value]="defaultExpanded() ? '0' : ''">
      <p-accordion-panel value="0">
        <p-accordion-header>
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider w-full">
            <ng-content select="[header]" />
          </span>
        </p-accordion-header>
        <p-accordion-content>
          <div class="flex flex-col">
            <ng-content />
          </div>
        </p-accordion-content>
      </p-accordion-panel>
    </p-accordion>
  `,
  styles: [
    `
      :host ::ng-deep .p-accordion {
        background: transparent;
      }
      :host ::ng-deep .p-accordion-panel {
        background: transparent;
        border: none;
        box-shadow: none;
      }
      :host ::ng-deep .p-accordion-header {
        background: transparent;
        border: none;
        padding: 0.5rem;
      }
      :host ::ng-deep .p-accordion-header-action {
        background: transparent;
        border: none;
        padding: 0;
        flex-direction: row-reverse;
        justify-content: space-between;
        gap: 0.5rem;
      }
      :host ::ng-deep .p-accordion-content {
        background: transparent;
        border: none;
        padding: 0.5rem;
        padding-top: 0;
      }
      :host ::ng-deep .p-accordion-toggle-icon {
        font-size: 0.75rem;
        color: #9ca3af;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSection {
  defaultExpanded = input(true);
}
