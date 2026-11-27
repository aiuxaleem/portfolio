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

/** The picture a card or a deck card shows: the cover, unless it is a strip far wider than a card's frame (2.2 : 1 or more),
    when the first picture of the entry's own gallery with a card's shape stands in, with its own alt text, so a five-brand
    strip of 1440 x 470 is not drawn at a third of the frame's height between blurred bands (sixth review for the decks,
    seventh for the cards on Projects and My Design Systems, 26 November 2026). Nothing is cropped. */
export const cardPicture = <P extends { src: ImageMetadata }>(cover: P | undefined, gallery: readonly P[] = []): P | undefined => {
  if (!cover || ratio(cover.src) < 2.2) return cover;
  return gallery.find(g => { const r = ratio(g.src); return r >= 1.2 && r <= 2; }) ?? cover;
};
