# TASK LIST

## Notifications Feature Breakdown

1. Data contract
- [x]Define notification model and unread rules.

2. State/service
- [x]Create a centralized notifications state (list, unread count, latest five).

3. Header integration
- [x]Add inbox badge logic:
  - [x]1..9 => numeric badge
  - [x]>9 => red dot only
- [x]Add dropdown preview (latest 5 + Show All button).

4. Notifications page
- [x]Add route and page UI for full list.
- [x]Include filtering/sorting if needed (optional).

5. Detail modal
- [x]Add reusable modal component for notification details.
- [x]Open from both dropdown item click and list item click.

6. State transitions
- [x]Mark as read on open/click (final behavior decision required).
- [x]Keep header badge, dropdown, and page synchronized.

7. Validation
- [x]Verify badge edge cases: 0, 1..9, 10+.
- [x]Verify dropdown item cap (5) and Show All navigation.