# Palette's Journal

## 2024-05-22 - Missing ARIA Labels on Search Inputs
**Learning:** The application uses placeholder text as the only visual label for search inputs, which is a common accessibility anti-pattern. Screen readers may not announce placeholders reliably, and they disappear when typing.
**Action:** Always add `aria-label` to inputs that rely on placeholders for labeling, ensuring the label text describes the input's purpose clearly (e.g., "Filtrer par adresse").

## 2024-05-23 - Accessibility of Filter Inputs
**Learning:** Filter inputs often lack associated `<label>` elements, relying solely on `placeholder` attributes which are insufficient for screen readers.
**Action:** Always verify that input fields have either a visible `<label>` with a `for` attribute or an `aria-label` attribute if a visual label is not design-compatible.
