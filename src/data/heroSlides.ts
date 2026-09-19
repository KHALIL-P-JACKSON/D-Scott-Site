import type { HeroSlide } from '../types'

/**
 * Studio photos live in `public/`, so each path is relative to the document URL.
 * That keeps them loading both in dev (`/`) and on GitHub Pages
 * (`/D-Scott-Site/`), where the app is served from a sub-path.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    src: './IMG_2100.JPEG',
    alt: 'XX long stiletto full set with a pink base, black and white chevron French tips and crystal charms',
    caption: 'XX Long stiletto set with chevron French & charms',
  },
  {
    src: './IMG_2101.JPEG',
    alt: 'Medium square acrylic set with a soft pink base and crisp white French tips',
    caption: 'Medium French tip square set',
  },
  {
    src: './IMG_2103.JPEG',
    alt: 'French tip coffin set with gold foil accents and hand-painted gold line art',
    caption: 'French tips with gold foil & line art',
  },
  {
    src: './IMG_2104 (2).JPEG',
    alt: 'Short square nails with a soft pink base and neon green French tips',
    caption: 'Short neon French tip set',
  },
]