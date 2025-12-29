## 2024-05-23 - Missing Debounce on Filter Inputs
**Learning:** The application was firing expensive filtering operations and DOM updates on every keystroke of the search inputs. This causes significant performance degradation as the dataset grows, because the entire table is cleared and rebuilt from scratch on each event.
**Action:** Always wrap real-time input handlers that trigger heavy UI updates or calculations with a `debounce` function. I implemented a simple debounce utility and applied it to all filter inputs with a 300ms delay.

## 2024-12-29 - Pre-computation of Filter Data
**Learning:** The application was performing expensive regex string cleaning (`cleanEtatRehab`, string normalizations) and `.toLowerCase()` conversions inside the `filter` loop on every keystroke. For a dataset of N items, this meant N * M operations per filter event.
**Action:** Moved these operations to `preprocessGovernmentData` and `preprocessMunicipalData` functions called once at data load time. The filter logic now uses pre-computed fields (`_search_adresse`, `_search_lot`, etc.), reducing the filter complexity to simple string comparisons.
