# Landing page background images

Drop banner / background images for the landing page here.

## background_1.png

Used as the full-width **"How it works"** banner on the home page
(`src/app/page.tsx`), which replaced the old "Three steps, under 5 minutes"
heading + step cards.

- Public URL: `/images/backgrounds/background_1.png`
- Rendered with the Next.js `<Image>` component, full width (`w-full h-auto`),
  preserving the image's native aspect ratio across desktop, tablet, and mobile.

### Changing the banner later

You only need to do two things — no component edits beyond one path:

1. Add the new image to this folder (`public/images/backgrounds/`).
2. In `src/app/page.tsx`, update `SECTION_BACKGROUND_IMAGE` to the new path.
   If the new image has a different native size, also update
   `SECTION_BACKGROUND_WIDTH` / `SECTION_BACKGROUND_HEIGHT` (those let
   `next/image` reserve space and avoid layout shift).

Recommended: a pre-composed banner sized around 1600–1920px wide, optimized
to keep the file light.
