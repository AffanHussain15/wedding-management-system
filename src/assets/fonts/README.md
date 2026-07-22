# Fonts

The app's typography (`src/theme/typography.ts`) uses two families:
**Inter** (UI/body) and **Playfair Display** (serif headings & big numbers).
Add the font files here, then link them — two steps:

## 1. Drop the files in this folder

The file names **must** match the family names used in `typography.ts`
(the file name becomes the `fontFamily` string on iOS/Android):

```
src/assets/fonts/
├── Inter-Regular.ttf           → fontFamily.regular   ('Inter-Regular')
├── Inter-Medium.ttf            → fontFamily.medium    ('Inter-Medium')
├── Inter-SemiBold.ttf          → fontFamily.semiBold  ('Inter-SemiBold')
├── Inter-Bold.ttf              → fontFamily.bold      ('Inter-Bold')
├── PlayfairDisplay-Regular.ttf → fontFamily.serif     ('PlayfairDisplay-Regular')
└── PlayfairDisplay-Bold.ttf    → fontFamily.serifBold ('PlayfairDisplay-Bold')
```

Download Inter from https://rsms.me/inter/ and Playfair Display from
Google Fonts (https://fonts.google.com/specimen/Playfair+Display).

## 2. Link the fonts into the native projects

```bash
npx react-native-asset
```

This copies the fonts into the iOS bundle (updating `Info.plist`) and the
Android `assets/fonts` folder, using the `assets` path declared in
`react-native.config.js`.

## 3. Turn the fonts on

Set `FONTS_LOADED = true` in `src/theme/typography.ts`, then rebuild:

```bash
npm run ios      # or: npm run android
```

Until this flag is `true`, the app intentionally uses the system font (at the
correct weight, with a platform serif for headings) so text always renders —
referencing an unlinked font would otherwise show at the wrong weight.

## Notes

- Until the fonts are added, RN falls back to the platform system font, so
  layouts still render correctly — only the exact typeface differs.
- If you use different weights/files, update the names in
  `src/theme/typography.ts` (`fontFamily`) to match.
- On iOS the `fontFamily` value must be the font's **PostScript name**, which
  usually matches the file name for Inter. If a weight doesn't apply, run
  `npx react-native-asset` again and confirm the name in Xcode's font list.
