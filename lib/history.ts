import { Design } from "./designSchema";

export interface HistoryState {
  history: Design[];
  currentIndex: number; // -1 means at latest, 0+ means in history
}

export function addToHistory(
  currentHistory: Design[],
  newSchema: Design,
  maxSteps: number = 10
): Design[] {
  // Add new schema, trim to maxSteps
  const updated = [...currentHistory, newSchema];
  return updated.slice(-maxSteps);
}

export function canUndo(historyIndex: number, historyLength: number): boolean {
  // Can undo if not at the beginning of history
  return historyIndex > 0 || (historyIndex === -1 && historyLength > 1);
}

export function canRedo(historyIndex: number, historyLength: number): boolean {
  // Can redo if not at the end of history
  return historyIndex >= 0 && historyIndex < historyLength - 1;
}

export function getCurrentSchema(
  history: Design[],
  historyIndex: number,
  currentSchema: Design
): Design {
  if (historyIndex === -1) {
    return currentSchema; // At latest
  }
  return history[historyIndex];
}
