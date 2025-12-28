## 2024-05-23 - Missing Debounce on Filter Inputs
**Learning:** The application was firing expensive filtering operations and DOM updates on every keystroke of the search inputs. This causes significant performance degradation as the dataset grows, because the entire table is cleared and rebuilt from scratch on each event.
**Action:** Always wrap real-time input handlers that trigger heavy UI updates or calculations with a `debounce` function. I implemented a simple debounce utility and applied it to all filter inputs with a 300ms delay.
