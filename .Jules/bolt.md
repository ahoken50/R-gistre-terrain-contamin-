# Bolt's Journal

## 2024-05-23 - Data Loading Optimization
**Learning:** Initial data loading was sequential (waterfall), causing unnecessary delay. Parallelizing independent Firebase fetches with `Promise.all` is safe because global state updates are atomic in the single-threaded JS event loop.
**Action:** Always check for independent async operations in initialization flows and batch them.

## 2024-05-23 - Memoizing Expensive Lookups
**Learning:** `identifyDecontaminatedLands` was rebuilding large Maps (O(N)) on every user interaction (validate/reject). Since the source data (`governmentData`) rarely changes, this was wasted effort. Moving the Map construction to the data loading/preprocessing phase (`preprocessGovernmentData`) and caching the result reduces the interaction cost to O(1) per lookup.
**Action:** When an expensive derived data structure is needed for frequent user interactions, calculate it once when the source data changes (cache it), rather than recalculating it on every interaction.
