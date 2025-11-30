export type ValidationErrorType = 'collision' | 'boundary' | 'oversized';

export interface BoxValidationError {
  boxId: string;
  boxName: string;
  type: ValidationErrorType;
  message: string;
}

export interface BoxBoundaryError {
  exceedsRight: boolean;
  exceedsBottom: boolean;
  canFit: boolean;  // false if box is too large for drawer
}
