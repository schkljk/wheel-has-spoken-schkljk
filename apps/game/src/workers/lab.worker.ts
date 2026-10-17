import { labRun, type LabReport } from '@whs/core';

// The balance lab's mass simulation, off the main thread.
export type LabRequest = { fights: number; seed: number };
export type LabMessage = { type: 'progress'; done: number; total: number } | { type: 'done'; report: LabReport };

// (typed by hand: the app's DOM types would treat `self` as a window)
const scope = self as unknown as { onmessage: ((e: MessageEvent<LabRequest>) => void) | null; postMessage(m: LabMessage): void };

scope.onmessage = (e) => {
  const { fights, seed } = e.data;
  const report = labRun(fights, seed, (done, total) => scope.postMessage({ type: 'progress', done, total }));
  scope.postMessage({ type: 'done', report });
};
