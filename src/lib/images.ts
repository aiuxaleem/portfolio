/* How a picture meets the frame it is shown in (components/ui/fitted-image.astro). */
import type { ImageMetadata } from 'astro';

const ratio = (img: { width: number; height: number }) => img.width / img.height;

/** True when the picture's shape differs from the frame's by more than 15%: it is then shown whole, not cut. */
/* Every uploaded picture is shown whole in its frame, over a blurred copy of itself (owner instruction, 9 November 2026, L-60:
   nothing is ever cut in a card, a thumbnail or a cover). Until L-60 a picture within 15% of the frame's shape filled it and
   was cut at its focus point (L-24); this stays the one switch, and the arguments are kept so every caller reads the same. */
export const shownWhole = (_img: { width: number; height: number }, _frame: number) => true;

/** A page's cover frame: the picture's own shape, kept between 6:5 and 12:5 so a very tall or very wide picture does not
    take the whole screen or shrink to a strip (beyond those, it is shown whole inside the frame). */
export const coverFrame = (img: ImageMetadata) => Math.min(2.4, Math.max(1.2, ratio(img)));
