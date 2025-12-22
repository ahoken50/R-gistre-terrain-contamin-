## 2024-05-23 - Accessibility of Filter Inputs
**Learning:** The application uses placeholders extensively as labels for filter inputs, which is a common but problematic pattern for screen reader users (WCAG 3.3.2).
**Action:** When working on form inputs where visual labels are omitted for design reasons, always ensure `aria-label` attributes are added with descriptive text (e.g., "Filtrer par adresse municipale" instead of just "Adresse") to provide context lost by the lack of visual hierarchy for non-visual users.
