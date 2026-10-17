import { useEffect, useRef, useState } from 'preact/hooks';
import { Sheet } from './kit';
import { toast } from '../state/game';
import { CARD_H, CARD_W, cardFile, drawShareCard, type CardData } from './share-card';

/** A big win as an image: preview, then save it or send it anywhere the phone can share to. */
export function ShareSheet({ d }: { d: CardData }) {
  const [url, setUrl] = useState<string | null>(null);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        await document.fonts?.ready;
        const c = await drawShareCard(d);
        if (!live) return;
        cv.current = c;
        setUrl(c.toDataURL('image/png'));
      } catch {
        toast('Could not draw the picture');
      }
    })();
    return () => void (live = false);
  }, []);
  const file = () => cardFile(cv.current!);
  const canShare = typeof navigator.canShare === 'function';
  const share = async () => {
    const f = await file();
    if (navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f], title: d.big });
      } catch {
        // closed the share sheet
      }
    } else save();
  };
  const save = async () => {
    const f = await file();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Picture saved');
  };
  return (
    <Sheet icon="star" title="Save this win" sub="A picture of the final blow, for the group chat">
      <div class="stack">
        <div class="share-prev" style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}>
          {url ? <img src={url} alt={`${d.winner.name} beats ${d.loser.name}: ${d.big}`} /> : <span class="hint">Painting it…</span>}
        </div>
        <div class="row">
          {canShare && (
            <button class="btn grow" disabled={!url} onClick={() => void share()}>
              Share
            </button>
          )}
          <button class={`btn grow${canShare ? ' ghost' : ''}`} disabled={!url} onClick={() => void save()}>
            Save picture
          </button>
        </div>
      </div>
    </Sheet>
  );
}
