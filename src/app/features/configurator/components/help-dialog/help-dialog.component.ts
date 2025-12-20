import { Component, ChangeDetectionStrategy, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'eligo-help-dialog',
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog 
      header="Pomoc" 
      [(visible)]="visible" 
      [modal]="true" 
      [dismissableMask]="true"
      [style]="{ width: '50vw' }" 
      [draggable]="false" 
      [resizable]="false"
    >
      <div class="flex flex-col gap-4">
        <section>
          <h3 class="font-bold text-lg mb-2">O aplikacji</h3>
          <p class="text-gray-700">
            Eligo to konfigurator wkładów do szuflad, który pozwala zaprojektować idealny układ organizerów dopasowany do Twoich potrzeb.
            Możesz dowolnie dodawać, usuwać i przesuwać pudełka, a aplikacja zadba o to, aby wszystko pasowało do Twojej szuflady.
          </p>
        </section>

        <section>
          <h3 class="font-bold text-lg mb-2">Jak zamówić?</h3>
          <ol class="list-decimal list-inside space-y-2 text-gray-700">
            <li>Zaprojektuj swój wkład w tym konfiguratorze.</li>
            <li>
              Pamiętaj, że możesz <strong>swobodnie przesuwać</strong> oraz <strong>zmieniać wymiary</strong> pudełek (chwytając za kropki na krawędziach).
            </li>
            <li>
              Zwróć uwagę na <strong>Kod Konfiguracji</strong> widoczny na dole ekranu. Będzie on potrzebny do realizacji zamówienia.
            </li>
            <li>
              Przejdź na naszą aukcję na 
              <a href="#" class="text-blue-600 hover:underline font-medium">Allegro</a>.
            </li>
            <li>
              Dodaj do koszyka odpowiednią liczbę przedmiotów, tak aby łączna kwota odpowiadała kwocie widocznej w konfiguratorze.
            </li>
            <li>
              W <strong>wiadomości do sprzedającego</strong> wklej wygenerowany Kod Konfiguracji.
            </li>
          </ol>
        </section>

        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
          <i class="pi pi-info-circle mr-2"></i>
          Pamiętaj, że kod konfiguracji zawiera wszystkie informacje o wymiarach szuflady oraz rozmieszczeniu i kolorach pudełek.
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <p-button label="Zamknij" (onClick)="visible.set(false)" [text]="true" />
      </ng-template>
    </p-dialog>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialogComponent {
  visible = model<boolean>(false);
}
