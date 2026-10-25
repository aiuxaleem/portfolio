/* How a picture meets the frame it is shown in (components/ui/fitted-image.astro). */
import type { ImageMetadata } from 'astro';

const ratio = (img: { width: number; height: number }) => img.width / img.height;

/** True when the picture's shape differs from the frame's by more than 15%: it is then shown whole, not cut. */
export const shownWhole = (img: { width: number; height: number }, frame: number) => Math.abs(Math.log(ratio(img) / frame)) > Math.log(1.15);

/** A page's cover frame: the picture's own shape, kept between 6:5 and 12:5 so a very tall or very wide picture does not
    take the whole screen or shrink to a strip (beyond those, it is shown whole inside the frame). */
export const coverFrame = (img: ImageMetadata) => Math.min(2.4, Math.max(1.2, ratio(img)));
