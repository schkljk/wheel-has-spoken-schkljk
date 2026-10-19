import { toast } from '../state/game';

/** Copies a line to share, or says it couldn't. */
export async function copyText(t: string) {
  try {
    await navigator.clipboard.writeText(t);
    toast('Copied. Paste it anywhere');
  } catch {
    toast("Couldn't copy here. Try again from the result");
  }
}
