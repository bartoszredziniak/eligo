import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateService, TemplateType } from '../../services/template.service';
import { DrawerService } from '../../../../core/services/drawer.service';
import { GridService } from '../../../../core/services/grid.service';
import { BoxColor } from '../../../../core/config/app-config';

@Component({
  selector: 'app-template-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50 relative shadow-inner"
      [style.width.px]="previewWidth()"
      [style.height.px]="previewHeight()"
    >
      @for (box of previewBoxes(); track $index) {
        <div 
          class="absolute transition-colors duration-300"
          [style.left.%]="(box.x / gridUnitsRef().width) * 100"
          [style.top.%]="(box.y / gridUnitsRef().depth) * 100"
          [style.width.%]="(box.width / gridUnitsRef().width) * 100"
          [style.height.%]="(box.depth / gridUnitsRef().depth) * 100"
        >
          <div 
            class="w-[90%] h-[90%] m-[5%] rounded-sm shadow-sm border border-black/5"
            [style.background-color]="getThumbColor(box.color)"
          ></div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePreviewComponent {
  private templateService = inject(TemplateService);
  private drawerService = inject(DrawerService);
  private gridService = inject(GridService);

  type = input.required<TemplateType>();
  selectedColor = input<BoxColor>('white');

  // Fixed preview size for consistency in cards
  readonly previewWidth = computed(() => 200);
  
  // Calculate height to maintain aspect ratio of the real drawer
  readonly previewHeight = computed(() => {
     const config = this.drawerService.drawerConfig();
     const ratio = config.depth / config.width;
     return this.previewWidth() * ratio;
  });

  readonly gridUnitsRef = computed(() => {
    const config = this.drawerService.drawerConfig();
    return {
      width: this.gridService.mmToGridUnits(config.width),
      depth: this.gridService.mmToGridUnits(config.depth)
    };
  });

  readonly previewBoxes = computed(() => {
    const config = this.drawerService.drawerConfig();
    return this.templateService.generateLayout(
      this.type(), 
      config.width, 
      config.depth, 
      this.selectedColor()
    );
  });

  getThumbColor(colorName: BoxColor): string {
    const map: Record<string, string> = {
      'white': '#ffffff',
      'black': '#333333',
      'beige': '#f5f5dc',
      'light-gray': '#d3d3d3',
      'dark-gray': '#a9a9a9'
    };
    return map[colorName] || '#ffffff';
  }
}
