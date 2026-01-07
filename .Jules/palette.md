## 2024-05-24 - Drop Zone Accessibility
**Learning:** Custom interactive elements like drag-and-drop zones (`div`) are often inaccessible to keyboard users.
**Action:** Always add `tabindex="0"`, `role="button"`, proper `aria-label`, and `keydown` listeners (Enter/Space) to custom interactive elements to ensure they are accessible.
