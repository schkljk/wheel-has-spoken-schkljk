import { useSignal } from '@preact/signals';
import { SaveFormatError, exportFileName, exportText, migrate, newSave, summarize, type SaveData } from '@whs/core';
import { go, loadSave, replaceSave, save, store, toast } from '../state/game';
import { closeSheet, confirm } from '../state/ui';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/kit';

/** "3 fighters: Bob (level 5), Ann (level 2) · 12 gems" */
export function describeSave(s: SaveData): string {
  const sum = summarize(s);
  const who = sum.fighters.map((f) => `${f.name} (level ${f.lvl})`).join(', ');
  const parts = [sum.fighters.length ? `${sum.fighters.length} fighter${sum.fighters.length > 1 ? 's' : ''}: ${who}` : 'No fighters'];
  if (sum.retired) parts.push(`${sum.retired} retired`);
  if (sum.gems) parts.push(`${sum.gems} gems`);
  return parts.join(' · ');
}

/** Asks, then replaces everything on this device with `next` (the current save is backed up first). */
export async function offerImport(next: SaveData, from: string, repaired: string[] = []): Promise<boolean> {
  const sum = summarize(next);
  const heads = [...repaired.map((r) => `repaired: ${r}`), ...sum.warnings];
  const ok = await confirm({
    title: 'Replace everything on this device?',
    body: `${describeSave(next)}.${heads.length ? ` Heads up: ${heads.join('; ')}.` : ''} Your current save goes into the backups first, so you can undo this.`,
    yes: `Load ${from}`,
  });
  if (!ok) return false;
  if (!replaceSave(next, `Before loading ${from}`)) return false;
  closeSheet();
  go({ screen: 'title' });
  toast('Save loaded');
  return true;
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(t).toLocaleDateString();
};

export function SaveSheet() {
  const paste = useSignal('');
  const showPaste = useSignal(false);
  const backups = store.listBackups();
  const legacy = store.readLegacy();
  const s = save.value;

  const tryImport = async (txt: string, from: string) => {
    try {
      const repaired: string[] = [];
      await offerImport(migrate(txt, Date.now(), repaired), from, repaired);
    } catch (e) {
      toast(e instanceof SaveFormatError ? e.message : "That doesn't look like a save from this game");
    }
  };
  const download = () => {
    const blob = new Blob([exportText(s)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = exportFileName(new Date());
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Backup file saved');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportText(s));
      toast('Save copied. Paste it somewhere safe');
    } catch {
      paste.value = exportText(s);
      showPaste.value = true;
      toast('Copy the text below by hand');
    }
  };
  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,application/json,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) await tryImport(await file.text(), 'the backup file');
    };
    input.click();
  };
  const restore = async (slot: number, at: number) => {
    try {
      await offerImport(store.readBackup(slot), `the backup from ${ago(at)}`);
    } catch {
      toast('That backup is damaged');
    }
  };
  const erase = async () => {
    const ok = await confirm({
      title: 'Erase everything?',
      body: 'All fighters, legacy, collection and records on this device. A backup is kept, so this can still be undone from here.',
      yes: 'Erase everything',
      danger: true,
    });
    if (!ok) return;
    loadSave(store.erase(s));
    closeSheet();
    go({ screen: 'title' });
    toast('Everything erased');
  };

  return (
    <Sheet icon="save" title="Your save" sub={`Saved on this device ${ago(s.savedAt)}`}>
      <div class="stack">
        {legacy && (
          <div class="card">
            <b>Your save from the old version</b>
            <p style={{ margin: '0.3rem 0 0.6rem' }}>
              <small>{describeSave(legacy)}</small>
            </p>
            <button class="btn sm block" onClick={() => offerImport(legacy, 'your old save')}>
              Bring it over
            </button>
          </div>
        )}
        <span class="sec-label">Back up</span>
        <button class="btn ghost block" onClick={download}>
          <Icon name="download" /> Save a backup file
        </button>
        <button class="btn ghost block" onClick={copy}>
          <Icon name="scroll" /> Copy the save as text
        </button>
        <span class="sec-label">Load a save</span>
        <button class="btn ghost block" onClick={pickFile}>
          <Icon name="upload" /> Load a backup file
        </button>
        <button class="btn ghost block" onClick={() => (showPaste.value = !showPaste.value)}>
          <Icon name="chat" /> Paste save text
        </button>
        {showPaste.value && (
          <div class="stack">
            <small>Works with text copied from this game, or from Settings, Back up your save in the old version.</small>
            <textarea
              class="savebox"
              aria-label="Save text"
              placeholder="Paste your save here"
              value={paste.value}
              onInput={(e) => (paste.value = (e.target as HTMLTextAreaElement).value)}
            />
            <button class="btn sm block" disabled={!paste.value.trim()} onClick={() => tryImport(paste.value, 'the pasted save')}>
              Load this save
            </button>
          </div>
        )}
        <span class="sec-label">Automatic backups</span>
        {backups.length ? (
          backups.map((b) => (
            <div class="card row" key={b.slot}>
              <Icon name="clock" />
              <span class="grow">
                <b>{ago(b.at)}</b>
                <br />
                <small>{b.reason}</small>
              </span>
              <button class="btn ghost sm" onClick={() => restore(b.slot, b.at)}>
                Restore
              </button>
            </div>
          ))
        ) : (
          <small>The game keeps the last three automatically. None yet.</small>
        )}
        <span class="sec-label">Start over</span>
        <button class="btn danger block" onClick={erase} disabled={JSON.stringify(s.roster) === JSON.stringify(newSave().roster) && !s.profile.spins}>
          <Icon name="trash" /> Erase everything
        </button>
      </div>
    </Sheet>
  );
}
