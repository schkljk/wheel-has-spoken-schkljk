import { clearErrors, errLog } from '../state/errlog';
import { toast } from '../state/game';
import { Sheet } from '../ui/kit';

/** The hidden error log (upgrade 45): what went wrong and where, to copy into a bug report. */
export function ErrorLogSheet() {
  const list = errLog.value;
  const text = () => list.map((e) => `${new Date(e.t).toISOString()} [${e.where}]${e.n ? ` ×${e.n}` : ''} ${e.msg}${e.stack ? '\n' + e.stack : ''}`).join('\n\n');
  return (
    <Sheet icon="gear" title="Error log" sub={list.length ? `${list.length} logged on this device` : 'Nothing logged. Suspiciously well-behaved'}>
      <div class="stack">
        {list.length ? (
          <>
            <ol class="errlog">
              {[...list].reverse().map((e, i) => (
                <li key={i}>
                  <small>
                    {new Date(e.t).toLocaleString()} · {e.where}
                    {e.n ? ` · ×${e.n}` : ''}
                  </small>
                  <b>{e.msg}</b>
                  {e.stack && <pre>{e.stack}</pre>}
                </li>
              ))}
            </ol>
            <div class="row">
              <button
                class="btn grow"
                onClick={() =>
                  void navigator.clipboard
                    ?.writeText(text())
                    .then(() => toast('Error log copied'))
                    .catch(() => toast('Could not copy here'))
                }
              >
                Copy log
              </button>
              <button class="btn ghost grow" onClick={clearErrors}>
                Clear
              </button>
            </div>
          </>
        ) : (
          <p class="hint">When something breaks, it shows up here, ready to copy into a message.</p>
        )}
      </div>
    </Sheet>
  );
}
