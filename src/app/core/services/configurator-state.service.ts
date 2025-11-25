import { Injectable, signal, computed } from '@angular/core';

export type InteractionMode = 'SELECT' | 'ADD_BOX';

@Injectable({
  providedIn: 'root',
})
export class ConfiguratorStateService {
  // State signals
  private readonly _selectedBoxId = signal<string | null>(null);
  private readonly _interactionMode = signal<InteractionMode>('SELECT');

  // Public signals
  readonly selectedBoxId = this._selectedBoxId.asReadonly();
  readonly interactionMode = this._interactionMode.asReadonly();

  // Computed signals
  readonly activePropertiesView = computed<'DRAWER' | 'BOX'>(() => {
    return this._selectedBoxId() ? 'BOX' : 'DRAWER';
  });

  selectBox(id: string | null) {
    this._selectedBoxId.set(id);
    if (id) {
      this._interactionMode.set('SELECT');
    }
  }

  startAddingBox() {
    this._interactionMode.set('ADD_BOX');
    this._selectedBoxId.set(null); // Deselect when starting to add
  }

  cancelAddingBox() {
    this._interactionMode.set('SELECT');
  }

  // Called when box is actually placed
  finishAddingBox() {
    this._interactionMode.set('SELECT');
  }
}
