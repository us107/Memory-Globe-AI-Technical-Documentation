
export interface MemoryImage {
  id: string;
  url: string;
}

export interface HandGestureState {
  rightPinch: number; // 0 to 1
  leftPinch: boolean; // true if pinching
  leftPos: { x: number, y: number };
  openness: number; // 0 (fist) to 1 (palm)
  isRightPinching: boolean;
}
