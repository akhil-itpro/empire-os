# Share-card fonts

Static TrueType copies of the app's fonts, used only by the share-card images
(`app/api/share/[kind]/route.tsx`). The image renderer can't read the web fonts
that `next/font` serves, so it reads these files instead.

| File | Family, weight | Source |
| --- | --- | --- |
| `BigShoulders-ExtraBold.ttf` | Big Shoulders 800, optical size 72 | Google Fonts |
| `BigShouldersStencil-Black.ttf` | Big Shoulders Stencil 900, optical size 72 | Google Fonts |
| `SchibstedGrotesk-Regular.ttf`, `-SemiBold`, `-Bold` | Schibsted Grotesk 400, 600, 700 | Google Fonts |

All are under the SIL Open Font License 1.1 (`OFL-BigShoulders.txt`, `OFL-SchibstedGrotesk.txt`),
which allows bundling them with the app.

## Web fonts

`app/fonts/BigShoulders-ExtraBold-latin.woff2` and `BigShouldersStencil-Black-latin.woff2` are the two
Big Shoulders files above, cut down to Latin characters (plus ₹ and common punctuation) and saved as WOFF2
with the `subset-font` package, so pages load faster. Same licence. Schibsted Grotesk still comes from
`next/font/google`.
