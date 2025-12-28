import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerService } from '../../../../core/services/drawer.service';
import { CommonModule } from '@angular/common';
import { TemplateService, TemplateType } from '../../services/template.service';
import { BOX_COLORS, BoxColor } from '../../../../core/config/app-config';
import { TemplatePreviewComponent } from '../template-preview/template-preview.component';

@Component({
  selector: 'app-welcome-templates',
  standalone: true,
  imports: [CommonModule, ButtonModule, TemplatePreviewComponent],
  template: `
    <div class="flex flex-col gap-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Wybierz układ i styl</h2>
        <p class="text-gray-600 max-w-lg mx-auto">
          Każdy z poniższych układów jest w pełni edytowalny. Po przejściu dalej będziesz mógł dowolnie zmieniać rozmiary, kolory i ułożenie pojemników.
        </p>
      </div>

      <!-- Color Selection -->
      <div class="flex flex-col items-center gap-3">
        <span class="text-sm font-medium text-gray-700">Wybierz kolor pojemników:</span>
        <div class="flex gap-2">
           @for (color of colors; track color.value) {
             <button
               type="button"
               class="w-8 h-8 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform hover:scale-110"
               [style.background-color]="color.hex"
               [class.ring-2]="selectedColor() === color.value"
               [class.ring-primary-500]="selectedColor() === color.value"
               [class.ring-offset-2]="selectedColor() === color.value"
               (click)="selectedColor.set(color.value)"
               [title]="color.label"
             ></button>
           }
        </div>
        <p class="text-xs text-gray-500">Później możesz zmienić kolor każdego pudełka z osobna.</p>
      </div>

      <!-- Templates Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 place-items-center">
        @for (template of templates; track template.id) {
          <div 
            class="w-full max-w-sm border-2 rounded-xl p-4 cursor-pointer transition-all hover:bg-gray-50 flex flex-col items-center text-center gap-3 relative focus:outline-none focus:ring-2 focus:ring-primary-500"
            [class.border-primary-500]="selectedTemplate() === template.id"
            [class.bg-primary-50]="selectedTemplate() === template.id"
            [class.border-gray-200]="selectedTemplate() !== template.id"
            (click)="selectedTemplate.set(template.id)"
            (keydown.enter)="selectedTemplate.set(template.id)"
            tabindex="0"
            role="radio"
            [attr.aria-checked]="selectedTemplate() === template.id"
          >
            <!-- Selection Indicator -->
            @if (selectedTemplate() === template.id) {
              <div class="absolute top-2 right-2 text-primary-600">
                <i class="pi pi-check-circle text-xl"></i>
              </div>
            }

            <div class="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center text-2xl shadow-sm">
              {{ template.icon }}
            </div>
            
            <div>
               <h3 class="font-bold text-gray-900">{{ template.label }}</h3>
               <p class="text-xs text-gray-500">{{ template.description }}</p>
            </div>

            <!-- Preview 2D -->
            @if(template.id !== 'empty') {
               <app-template-preview 
                 [type]="template.id" 
                 [selectedColor]="selectedColor()"
                 class="mt-2 block pointer-events-none"
               />
            } @else {
               <div class="mt-2 w-[200px] h-[150px] bg-white border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-300">
                 Pusto
               </div>
            }
          </div>
        }
      </div>

      <div class="flex gap-3 mt-4">
        <p-button 
          label="Wróć" 
          styleClass="p-button-text w-full" 
          (onClick)="back()">
        </p-button>
        <p-button 
          label="Zakończ" 
          icon="pi pi-check" 
          iconPos="right"
          styleClass="w-full"
          [disabled]="!selectedTemplate()"
          (onClick)="finish()">
        </p-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeTemplatesComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Inject ActivatedRoute
  private drawerService = inject(DrawerService);
  private templateService = inject(TemplateService);

  readonly colors = BOX_COLORS;
  selectedColor = signal<BoxColor>('white');
  selectedTemplate = signal<TemplateType | null>(null);

  templates: { id: TemplateType; label: string; description: string; icon: string }[] = [
    { 
      id: 'empty', 
      label: 'Pusta szuflada', 
      description: 'Zacznij od zera i dodawaj pudełka ręcznie.', 
      icon: '⬜' 
    },
    { 
      id: 'cutlery', 
      label: 'Sztućce', 
      description: 'Długie przegródki dopasowane do sztućców.', 
      icon: '🍴' 
    },
    { 
      id: 'small', 
      label: 'Drobiazgi', 
      description: 'Siatka małych przegródek na drobne elementy.', 
      icon: '🔩' 
    },
    { 
      id: 'large', 
      label: 'Duże przedmioty', 
      description: 'Większe przegródki na większe akcesoria.', 
      icon: '📦' 
    },
  ];

  back() {
    // Navigate strictly to sibling route 'dimensions' relative to the parent of this route
    this.router.navigate(['../dimensions'], { relativeTo: this.route });
  }

  finish() {
    const template = this.selectedTemplate();
    if (!template) return;

    this.applyTemplate(template);
    this.router.navigate(['configurator']);
  }

  private applyTemplate(template: TemplateType) {
    this.drawerService.clearBoxes(); // Clear existing boxes
    
    if (template === 'empty') return;

    const config = this.drawerService.drawerConfig();
    const boxes = this.templateService.generateLayout(
      template, 
      config.width, 
      config.depth, 
      this.selectedColor()
    );

    // Apply generated boxes to state
    boxes.forEach(box => this.drawerService.addBox(box));
  }
}

