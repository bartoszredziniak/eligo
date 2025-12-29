import { Component, ChangeDetectionStrategy, model, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { RatingModule } from 'primeng/rating';

export interface SurveyQuestion {
  type: 'rating' | 'text' | 'open' | 'link' | 'multiple_choice' | 'single_choice';
  question: string;
  description?: string;
  lowLabel?: string;
  highLabel?: string;
  scale?: number;
}

export interface Survey {
  id: string;
  name: string;
  questions: SurveyQuestion[];
}

@Component({
  selector: 'eligo-survey-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    DialogModule, 
    ButtonModule, 
    TextareaModule, 
    FormsModule,
    RatingModule
  ],
  template: `
    <p-dialog 
      [header]="survey()?.name || 'Ankieta'" 
      [(visible)]="visible" 
      [modal]="true" 
      [dismissableMask]="true"
      [style]="{ width: '50vw', maxWidth: '500px' }" 
      [breakpoints]="dialogBreakpoints"
      [draggable]="false" 
      [resizable]="false"
    >
      @if (survey(); as s) {
        <div class="flex flex-col gap-6">
          @for (q of s.questions; track i; let i = $index) {
          <div class="flex flex-col gap-2">
            <h3 class="font-bold text-lg">{{ q.question }}</h3>
            @if (q.description) {
              <p class="text-gray-600 text-sm">{{ q.description }}</p>
            }

            <!-- Rating Question -->
            @if (q.type === 'rating') {
              <div class="flex flex-col gap-2 items-center">
                <p-rating [(ngModel)]="responses[i]" [stars]="10"></p-rating>
                <div class="flex justify-between w-full text-xs text-gray-500 px-2">
                  <span>{{ q.lowLabel || 'Not likely' }}</span>
                  <span>{{ q.highLabel || 'Very likely' }}</span>
                </div>
              </div>
            }

            <!-- Text Question -->
            @if (q.type === 'text' || q.type === 'open') {
              <div class="w-full">
                <textarea 
                  pInputTextarea 
                  [(ngModel)]="responses[i]" 
                  rows="3" 
                  class="w-full"
                  placeholder="Twoja odpowiedź..."
                ></textarea>
              </div>
            }
            
             <!-- Link/Other (Basic fallback) -->
            @if (q.type !== 'rating' && q.type !== 'text' && q.type !== 'open') {
              <div class="text-yellow-600 text-sm">
                Typ pytania '{{q.type}}' nie jest w pełni obsługiwany w tym widoku.
              </div>
            }

          </div>
          }
        </div>
      }
      
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
           <p-button label="Anuluj" (onClick)="onCancel()" [text]="true" severity="secondary" />
           <p-button label="Wyślij" (onClick)="onSubmit()" [disabled]="!isValid()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyDialogComponent {
  protected readonly dialogBreakpoints = { '960px': '75vw', '640px': '90vw' };
  
  visible = model<boolean>(false);
  survey = input<Survey | null>(null);
  
  surveySubmit = output<{ surveyId: string, responses: (string | number)[] }>();

  responses: (string | number)[] = [];

  onCancel() {
    this.visible.set(false);
  }

  onSubmit() {
    const s = this.survey();
    if (s) {
      this.surveySubmit.emit({ surveyId: s.id, responses: this.responses });
      this.visible.set(false);
      this.responses = []; // Reset after send
    }
  }

  isValid(): boolean {
    // Basic validation: Check if at least one response is present
    return this.responses.some(r => r !== undefined && r !== null && r !== '');
  }
}
