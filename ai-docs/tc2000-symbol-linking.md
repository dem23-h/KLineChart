# Symbol Linking

Symbol linking is a mechanism that synchronizes the active ticker symbol across multiple tabs/panels in the application. When a user changes the symbol in one tab, other tabs that share the same link group automatically update to display that symbol.

## How It Works

Every tab (chart, watchlist, news panel, etc.) is assigned to a **symbol link group**, identified by a color. Tabs in the same group stay in sync — changing the symbol in any one of them updates all the others in that group.

## Link Groups

There are **8 color-coded link groups** (e.g., blue, red, green, purple, etc.) plus two special groups:

### Regular Groups (colors 1–8)
- Tabs assigned to the same color group share the same active symbol.
- Changing the symbol in any tab within a group broadcasts the change to all other tabs in that group.
- **Default:** All new tabs start in the **blue** group, meaning everything is linked together out of the box.

### Special: "All" Group (yellow)
- A tab set to the yellow/all group will respond to symbol changes from **any** link group.
- Useful for a tab that should always follow whatever the user is looking at, regardless of which group triggered the change.

### Special: "None" / Independent Group (grey)
- A tab set to grey is **unlinked** — it does not respond to symbol changes from any group.
- The symbol in this tab only changes when the user manually changes it within that specific tab.
- Useful for pinning a reference chart (e.g., always showing SPY) while freely browsing other symbols elsewhere.

## Typical Use Cases

1. **Single-symbol workflow (default):** All tabs are blue. User clicks AAPL in a watchlist → the chart tab, news tab, and fundamentals tab all switch to AAPL.

2. **Multi-symbol workflow:** User sets two chart tabs to red and another two to green. Changing the symbol in a red-linked watchlist only updates the red charts; the green charts stay on their own symbol. This lets the user compare two different symbols side by side.

3. **Pinned reference tab:** A chart showing SPY is set to grey (independent). No matter what the user does in other tabs, the SPY chart stays put.

4. **Global follower tab:** A news panel is set to yellow (all). It updates whenever the user changes a symbol in *any* group, so the user always sees news for whatever they last selected.

## Implementation Notes

- Each tab stores its `linkGroup` value (e.g., `"blue"`, `"red"`, `"none"`, `"all"`).
- When a symbol change occurs in a tab, the app broadcasts an event like `{ symbol: "AAPL", linkGroup: "blue" }`.
- Every other tab receives the event and checks:
  - If my group matches the event's group → update my symbol.
  - If my group is `"all"` → update my symbol regardless of the event's group.
  - If my group is `"none"` → ignore the event.
- The link group selector should be a small, visible UI element on each tab (e.g., a colored dot or dropdown in the tab header) so the user can quickly see and change which group a tab belongs to.
- Symbol linking works across all layouts/workspaces — if the user has multiple layout configurations, the linking still applies globally within the active workspace.
