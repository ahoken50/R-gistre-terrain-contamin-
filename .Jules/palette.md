## 2024-05-23 - Accessibility of Filter Inputs
**Learning:** Filter inputs often lack associated `<label>` elements, relying solely on `placeholder` attributes which are insufficient for screen readers.
**Action:** Always verify that input fields have either a visible `<label>` with a `for` attribute or an `aria-label` attribute if a visual label is not design-compatible.
