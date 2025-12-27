# Bolt's Journal

## 2024-05-22 - [DOM Batching Strategy]
**Learning:** Manipulating the DOM inside a loop (e.g., appending rows to a table one by one) triggers frequent reflows and repaints, which degrades performance, especially with large datasets.
**Action:** Always use `DocumentFragment` to batch DOM insertions. Create the fragment, append all elements to it in memory, and then append the fragment to the DOM in a single operation. This minimizes reflows to just one.
