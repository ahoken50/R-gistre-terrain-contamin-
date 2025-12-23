## 2024-12-23 - Accessibility Pattern for Filter Inputs
**Learning:** Filter inputs in data tables often lack visual labels to save space, relying on placeholders. This creates a persistent accessibility gap where screen readers read "Edit text" instead of the field's purpose.
**Action:** Systematically add `aria-label` matching the placeholder text for all filter inputs in the future.
