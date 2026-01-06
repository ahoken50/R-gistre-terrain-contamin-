## 2024-05-23 - Accessibility of Custom Interactive Elements
**Learning:** Custom interactive elements like file drop zones (`<div>`) are not natively keyboard accessible.
**Action:** Always add `tabindex="0"`, `role="button"`, and appropriate `aria-label` attributes to these elements. Crucially, implement a `keydown` event listener to handle 'Enter' and 'Space' keys, triggering the same action as the click handler (e.g., opening a file dialog).
