# Fonts

The app's typography (`src/theme/typography.ts`) expects the **Inter** family.
Add the font files here, then link them — two steps:

## 1. Drop the files in this folder

The file names **must** match the family names used in `typography.ts`
(the file name becomes the `fontFamily` string on iOS/Android):

```
src/assets/fonts/
├── Inter-Regular.ttf     → fontFamily.regular  ('Inter-Regular')
├── Inter-Medium.ttf      → fontFamily.medium   ('Inter-Medium')
├── Inter-SemiBold.ttf    → fontFamily.semiBold ('Inter-SemiBold')
└── Inter-Bold.ttf        → fontFamily.bold     ('Inter-Bold')
```

Download Inter from https://rsms.me/inter/ or Google Fonts.

## 2. Link the fonts into the native projects

```bash
npx react-native-asset
```

This copies the fonts into the iOS bundle (updating `Info.plist`) and the
Android `assets/fonts` folder, using the `assets` path declared in
`react-native.config.js`.

Then rebuild the app:

```bash
npm run ios      # or: npm run android
```

## Notes

- Until the fonts are added, RN falls back to the platform system font, so
  layouts still render correctly — only the exact typeface differs.
- If you use different weights/files, update the names in
  `src/theme/typography.ts` (`fontFamily`) to match.
- On iOS the `fontFamily` value must be the font's **PostScript name**, which
  usually matches the file name for Inter. If a weight doesn't apply, run
  `npx react-native-asset` again and confirm the name in Xcode's font list.
