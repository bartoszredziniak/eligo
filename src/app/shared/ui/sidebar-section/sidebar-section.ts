import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'eligo-sidebar-section',
  imports: [AccordionModule],
  template: `
    <p-accordion [value]="defaultExpanded() ? '0' : ''">
      <p-accordion-panel value="0">
        <p-accordion-header>
            <ng-content select="[header]" />
        </p-accordion-header>
        <p-accordion-content>
            <ng-content />
        </p-accordion-content>
      </p-accordion-panel>
    </p-accordion>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSection {
  defaultExpanded = input(true);
}