import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eligo-canvas-stage',
  imports: [CommonModule],
  template: `
    <div class="w-full h-full flex items-center justify-center bg-gray-50 relative overflow-hidden">
      <!-- Grid Background Pattern -->
      <div
        class="absolute inset-0 opacity-10"
        style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"
      ></div>

      <div class="z-10 flex flex-col items-center gap-4">
        <div
          class="w-16 h-16 border-4 border-gray-300 rounded-full border-t-blue-500 animate-spin"
        ></div>
        <span class="text-gray-500 font-medium">Podgląd 3D (Wkrótce)</span>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasStage {}
