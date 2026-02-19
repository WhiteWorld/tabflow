import type { RuntimeState } from '../shared/types';
import { getRuntime, setRuntime } from '../shared/storage';

let _runtime: RuntimeState | null = null;

export async function loadRuntime(): Promise<RuntimeState> {
  _runtime = await getRuntime();
  return _runtime;
}

export function getCachedRuntime(): RuntimeState | null {
  return _runtime;
}

export async function saveRuntime(runtime: RuntimeState): Promise<void> {
  _runtime = runtime;
  await setRuntime(runtime);
}

export async function updateRuntime(updater: (r: RuntimeState) => void): Promise<RuntimeState> {
  const runtime = await loadRuntime();
  updater(runtime);
  await saveRuntime(runtime);
  return runtime;
}
