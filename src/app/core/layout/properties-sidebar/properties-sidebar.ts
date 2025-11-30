import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { UiSidebar } from '../../../shared/ui/ui-sidebar/ui-sidebar';
import { DrawerService } from '../../services/drawer.service';
import { ConfiguratorStateService } from '../../services/configurator-state.service';
import { DrawerPropertiesForm } from './drawer-properties-form/drawer-properties-form';
import { BoxPropertiesForm } from './box-properties-form/box-properties-form';
import { BoxColor } from '../../models/drawer.models';

@Component({
  selector: 'eligo-properties-sidebar',
  imports: [UiSidebar, DrawerPropertiesForm, BoxPropertiesForm],
  template: `
    <eligo-ui-sidebar>
      @switch (viewMode()) {
        @case ('DRAWER') {
          <eligo-drawer-properties-form
            [config]="drawerConfig()"
            (widthChange)="updateDrawerWidth($event)"
            (depthChange)="updateDrawerDepth($event)"
            (heightChange)="updateDrawerHeight($event)"
          />
        }
        @case ('BOX') {
          @if (selectedBox(); as box) {
            <eligo-box-properties-form
              [box]="box"
              [drawerHeight]="drawerConfig().height"
              (xChange)="updateBoxX(box.id, $event)"
              (yChange)="updateBoxY(box.id, $event)"
              (widthChange)="updateBoxWidth(box.id, $event)"
              (depthChange)="updateBoxDepth(box.id, $event)"
              (heightChange)="updateBoxHeight(box.id, $event)"
              (colorChange)="updateBoxColor(box.id, $event)"
              (nameChange)="updateBoxName(box.id, $event)"
              (duplicate)="duplicateBox(box.id)"
              (rotate)="rotateBox(box.id)"
              (deleteBox)="removeBox(box.id)"
            />
          }
        }
      }
    </eligo-ui-sidebar>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesSidebar {
  private readonly drawerService = inject(DrawerService);
  private readonly stateService = inject(ConfiguratorStateService);

  readonly drawerConfig = computed(() => this.drawerService.drawerConfig());
  readonly selectedBox = computed(() => {
    const selectedId = this.stateService.selectedBoxId();
    if (!selectedId) return null;
    return this.drawerService.boxes().find((b) => b.id === selectedId) || null;
  });
  readonly viewMode = this.stateService.activePropertiesView;

  updateDrawerWidth(value: number) {
    this.drawerService.updateDrawerConfig({ width: value });
  }

  updateDrawerDepth(value: number) {
    this.drawerService.updateDrawerConfig({ depth: value });
  }

  updateDrawerHeight(value: number) {
    this.drawerService.updateDrawerConfig({ height: value });
  }

  updateBoxX(id: string, value: number) {
    this.drawerService.updateBox(id, { x: value });
  }

  updateBoxY(id: string, value: number) {
    this.drawerService.updateBox(id, { y: value });
  }

  updateBoxWidth(id: string, value: number) {
    this.drawerService.updateBox(id, { width: value });
  }

  updateBoxDepth(id: string, value: number) {
    this.drawerService.updateBox(id, { depth: value });
  }

  updateBoxHeight(id: string, value: number) {
    this.drawerService.updateBox(id, { height: value });
  }

  updateBoxColor(id: string, color: BoxColor) {
    this.drawerService.updateBox(id, { color });
  }

  updateBoxName(id: string, name: string) {
    this.drawerService.updateBox(id, { name });
  }

  removeBox(id: string) {
    this.drawerService.removeBox(id);
    this.stateService.selectBox(null);
  }

  duplicateBox(id: string) {
    this.drawerService.duplicateBox(id);
  }

  rotateBox(id: string) {
    this.drawerService.rotateBox(id);
  }

  deselectBox() {
    this.stateService.selectBox(null);
  }
}
