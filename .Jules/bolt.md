# Bolt's Journal

## 2024-05-23 - Data Loading Optimization
**Learning:** Initial data loading was sequential (waterfall), causing unnecessary delay. Parallelizing independent Firebase fetches with `Promise.all` is safe because global state updates are atomic in the single-threaded JS event loop.
**Action:** Always check for independent async operations in initialization flows and batch them.
