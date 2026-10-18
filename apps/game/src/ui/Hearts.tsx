import { Icon } from './Icon';

/** Grit as a row of pixel hearts: full ones, then the lost ones. */
export function Hearts({ n, max }: { n: number; max: number }) {
  const have = Math.max(0, Math.min(max, n));
  return (
    <span class="hearts" role="img" aria-label={`${have} of ${max} grit`}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name={i < have ? 'heart' : 'heart_empty'} />
      ))}
    </span>
  );
}
