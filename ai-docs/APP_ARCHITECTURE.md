# KLineChart App — Architecture & Functionality Reference

This document describes the custom trading chart frontend built inside `KLineChart/app/`. It is intended as a handoff reference so that any developer (or AI assistant) can understand the full system without reading every source file.

## Overview

A TradingView-style charting application built with **React + Vite**, powered by the **KLineChart v10 open-source library** (compiled directly from source, not the npm package). It connects to a Rust axum backend (`mock-data-provider`) for market data via REST and WebSocket.

```
KLineChart/
├── src/              ← KLineChart v10 library source (cloned from GitHub)
├── ai-docs/          ← Architecture & API reference docs
├── app/              ← Our custom frontend application
│   ├── src/
│   │   ├── App.jsx               ← Root layout manager (single/dual panel)
│   │   ├── main.jsx              ← React entry point
│   │   ├── config/
│   │   │   ├── constants.js      ← Tickers, periods, indicator lists
│   │   │   └── theme.js          ← TradingView dark theme registration
│   │   ├── services/
│   │   │   ├── market.js         ← REST/WS API helpers
│   │   │   └── chartState.js     ← Drawing persistence (save/load/clear)
│   │   ├── storage/
│   │   │   ├── StorageProvider.js ← Abstract storage interface
│   │   │   ├── LocalStorageProvider.js ← localStorage implementation
│   │   │   └── index.js          ← Storage factory (swap backends here)
│   │   ├── components/
│   │   │   ├── ChartPanel.jsx    ← Self-contained chart (init, data, WS, persistence)
│   │   │   ├── Toolbar.jsx       ← Per-panel top bar: ticker, periods, indicators, layout toggle
│   │   │   ├── DrawingToolbar.jsx← Shared left sidebar: drawing tools
│   │   │   ├── SymbolSearch.jsx  ← Modal ticker search
│   │   │   ├── Dropdown.jsx      ← Reusable dropdown
│   │   │   └── Watermark.jsx     ← Ticker/period/description overlay
│   │   └── test/
│   │       ├── setup.js          ← Vitest setup (jest-dom, localStorage mock)
│   │       ├── storage.test.js   ← StorageProvider & LocalStorageProvider tests
│   │       ├── chartState.test.js← Drawing persistence tests
│   │       ├── market.test.js    ← Resolution/period conversion tests
│   │       ├── constants.test.js ← Config validation tests
│   │       └── components.test.jsx ← Watermark & Dropdown render tests
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
```

## Key Architectural Decisions

### Direct Source Compilation
The app imports KLineChart via a Vite alias (`klinecharts` → `../src/index.ts`). This gives full control over the library internals — no npm dependency, no build artifacts. The trade-off is ~165+ modules compiled on every build.

### KLineChart v10 DataLoader Pattern
v10 replaced the v9 imperative API (`applyNewData`, `updateData`, `loadMore`) with a declarative `DataLoader`:
- **`getBars({ type, timestamp, symbol, period, callback })`** — called by the chart to fetch historical bars. `type` is `'forward'` (initial/newer) or `'backward'` (scrolling left). We fetch 500 bars per request from the REST API.
- **`subscribeBar({ symbol, period, callback })`** — called when the chart needs real-time updates. We open a WebSocket to the backend.
- **`unsubscribeBar()`** — called when the chart no longer needs updates (ticker/period change). We close the WebSocket.

### Symbol and Period Model
- **SymbolInfo**: `{ ticker: string, pricePrecision: number, volumePrecision: number }` — set via `chart.setSymbol()`
- **Period**: `{ type: 'minute'|'hour'|'day'|'week'|'month', span: number }` — set via `chart.setPeriod()`
- Each period also has a `resolution` string (e.g. `'1'`, `'60'`, `'1D'`) used for the backend API and a `label` (e.g. `'1m'`, `'1h'`, `'1D'`) for the UI.

## Component Responsibilities

### App.jsx (Layout Manager)
Manages the top-level layout and routes interactions to the active panel:
- **Layout state**: `'single'` (one chart) or `'dual'` (two side-by-side charts)
- **Active panel tracking**: `activeIdx` (0 or 1) — determines which panel receives drawing tools and keyboard actions
- **Proxy refs**: `activeChartRef`, `activeOverlayCallbacks`, `activePersistDrawings` — always point to the active panel's API, passed to the shared DrawingToolbar
- **Keyboard handling**: Delete/Backspace delegates to the active panel's `removeSelectedOverlay()`
- **Layout structure**: DrawingToolbar (shared, left) + chartsArea (1 or 2 ChartPanels)

### ChartPanel.jsx (Self-Contained Chart)
Each panel is fully independent — owns its own chart instance, data connection, and state:
- **Chart initialization**: `init()` with dark theme, bar spacing (14px), volume pane (1/3 height, draggable)
- **Data loading**: DataLoader wired to REST (`/api/history`) and WebSocket (`ws://localhost:8000/ws`)
- **Drawing persistence**: saves/restores overlay drawings per symbol via `chartState` service
- **Overlay lifecycle**: centralized `overlayCallbacks()` factory produces `onSelected`, `onDeselected`, `onDrawEnd` handlers
- **Ticker switching**: saves current drawings → clears overlays → sets new symbol → restores new drawings
- **Resize handling**: uses `ResizeObserver` (handles both window resize and layout switch)
- **Active indicator**: blue top border when the panel is active
- **Exposes API via `useImperativeHandle`**: `chart`, `overlayCallbacks()`, `persistDrawings()`, `removeSelectedOverlay()`

### Toolbar.jsx (Per-Panel Top Bar)
Each ChartPanel renders its own Toolbar:
- **Ticker button**: shows current ticker, click opens SymbolSearch
- **Period buttons**: 9 timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W, 1M), active one highlighted
- **Indicators dropdown**: main indicators (overlay on candle pane) and sub indicators (separate panes), toggled with checkmarks
- **Keyboard shortcut**: any letter key opens SymbolSearch pre-filled with that letter — only fires when `isActive` is true
- **Layout toggle**: single/dual layout icons on the right side of the toolbar (SVG icons for single rect and two side-by-side rects)

### DrawingToolbar.jsx (Shared Left Sidebar)
Shared across all panels — always operates on the active panel via proxy refs from App:
- **Tool groups**: Cursor, Lines (9 types), Channels (2), Fibonacci (1), Shapes (2), Price (3)
- **Submenus**: groups with multiple tools expand on click, showing all variants
- **Icon memory**: remembers last-selected tool per group, updates the group's icon
- **Bottom actions**: Magnet mode toggle, visibility toggle, clear all drawings
- **Overlay creation**: uses `overlayCallbacks()` from active panel to attach persistence hooks

### SymbolSearch.jsx (Modal)
- Fetches full symbol list from `/api/symbols` on mount
- Filters by ticker or name (case-insensitive)
- Keyboard navigation: Arrow Up/Down, Enter to select, Escape to close
- Accepts `initialQuery` prop so letter-key activation pre-fills the search

### Watermark.jsx
- Displays ticker + period (large, faint text) and description below
- Positioned at 33% from top (center of main candle pane, above volume sub-pane)
- `pointerEvents: none`, `zIndex: 1` — visible but non-interactive

### Dropdown.jsx
Generic reusable dropdown with toggle button and absolutely positioned content.

## Multi-Panel Layout

The app supports TradingView-style split layouts:
- **Single**: one full-width chart panel (default)
- **Dual**: two side-by-side chart panels, each independent (own ticker, period, indicators, drawings)
- Toggle via layout icons in each panel's toolbar (right side)
- Click a panel to make it active — the active panel gets a **blue top border** and receives all drawing toolbar actions
- Each panel has its own WebSocket connection and data loader
- Switching from dual to single destroys the second panel; switching back creates a fresh one
- The shared DrawingToolbar always targets the active panel via proxy refs

### How Active Panel Routing Works
```
App.jsx
├─ DrawingToolbar ← receives activeChartRef (proxy to active panel's chart)
├─ ChartPanel[0] ← ref={panel0Ref}, isActive={activeIdx===0}
└─ ChartPanel[1] ← ref={panel1Ref}, isActive={activeIdx===1}

activeChartRef.current  →  panelNRef.current.chart  (live getter)
activeOverlayCallbacks  →  panelNRef.current.overlayCallbacks()
activePersistDrawings   →  panelNRef.current.persistDrawings()
```

## Persistence System

### Architecture (Repository Pattern)
```
ChartPanel.jsx
  └─ chartState.js          ← domain logic (serialize/deserialize overlays)
       └─ storage/index.js   ← factory returns active StorageProvider
            └─ LocalStorageProvider.js  ← current impl (swap to Mongo later)
```

### StorageProvider Interface
All methods are async (localStorage is sync, but MongoDB/REST will be async):
- `get(collection, key)` → parsed data or null
- `set(collection, key, data)` → void
- `delete(collection, key)` → void

**Collections** are entity-type namespaces. Currently only `'drawings'` exists. Future collections: `'indicators'`, `'settings'`, `'layouts'`, etc.

**Keys** are typically the symbol ticker (e.g. `'AAPL'`).

### LocalStorageProvider
Keys formatted as `klinechart:{collection}:{key}`. Data stored as JSON strings.

### What Gets Persisted for Drawings
Each overlay is serialized to:
```json
{
  "id": "overlay_123",
  "name": "straightLine",
  "points": [
    { "timestamp": 1700000000000, "value": 150.25 },
    { "timestamp": 1700100000000, "value": 155.50 }
  ],
  "paneId": "candle_pane",
  "lock": false,
  "visible": true,
  "zLevel": 0,
  "mode": "normal",
  "styles": null
}
```
Points use `timestamp` + `value` only (not `dataIndex`, which shifts when data changes).

### Save Triggers
- Drawing completed (`onDrawEnd` callback)
- Overlay deleted (Delete/Backspace key)
- All drawings cleared (trash button)
- Ticker switched (save before switch)

### Restore Triggers
- Chart initialization (default ticker)
- Ticker switched (restore after switch)

Event handlers (`onSelected`, `onDeselected`, `onDrawEnd`) are reattached on restore since they cannot be serialized.

## Backend Integration

The app connects to a **Rust axum server** (`mock-data-provider`) on port 8000:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/history?symbol=AAPL&from=...&to=...&resolution=1D` | GET | Historical OHLCV bars |
| `/api/symbols` | GET | List of available symbols (ticker, name, exchange, pricescale) |
| `ws://localhost:8000/ws` | WebSocket | Real-time bar updates |

WebSocket protocol:
- Client sends: `{ "action": "subscribe", "ticker": "AAPL", "resolution": "1D" }`
- Server sends: `{ "type": "bar", "bar": { "time": 1700000, "open": 150, "high": 155, "low": 149, "close": 153, "volume": 1000000 } }`

Vite dev server proxies `/api` requests to `localhost:8000`.

## Theme & Styling

Registered as `'tv_dark'` via `registerStyles()`:
- **Background**: #131722 (dark navy)
- **Candles**: up #26a69a (teal), down #ef5350 (red)
- **Text**: primary #d1d4dc, muted #787b86
- **Borders/separators**: #2a2e39
- **Grid**: disabled (solid background)
- **Crosshair**: dashed lines with #363a45 label background
- **Overlays**: #1677FF accent
- **Bar spacing**: 14px (wider than default 10px, matches TradingView zoom level)
- **Volume pane**: 1/3 of chart height, drag-resizable

## Running the App

```bash
# Terminal 1: Start the backend
cd mock-data-provider && cargo run

# Terminal 2: Start the frontend
cd KLineChart/app && npm install && npm run dev
```

Frontend runs on `http://localhost:5175`, backend on `http://localhost:8000`.

## Testing

Tests use **vitest** + **@testing-library/react** + **jsdom**. Run with `npm test` (single run) or `npm run test:watch`.

| File | Tests | Covers |
|------|-------|--------|
| `storage.test.js` | 14 | StorageProvider abstract contract, LocalStorageProvider CRUD, namespacing, isolation, corruption |
| `chartState.test.js` | 15 | Overlay serialization (strips callbacks/dataIndex, keeps allowed fields), save/load/clear per symbol, roundtrip |
| `market.test.js` | 11 | `resolutionToSeconds` and `periodToResolution` for all timeframes + edge cases |
| `constants.test.js` | 11 | Period completeness/uniqueness, default values, indicator lists, no main/sub overlap |
| `components.test.jsx` | 9 | Watermark rendering/updates, Dropdown open/close/toggle |

## Future Extension Points

- **New storage backend**: implement `StorageProvider` (e.g. `MongoStorageProvider`), swap in `storage/index.js`
- **New persistence types**: add functions to `chartState.js` using new collection names (e.g. `saveIndicators('AAPL', data)`)
- **New drawing tools**: add entries to `TOOL_GROUPS` in `DrawingToolbar.jsx` — KLineChart has many built-in overlay types
- **New indicators**: add to `MAIN_INDICATORS` or `SUB_INDICATORS` in `constants.js`
- **New periods**: add to `PERIODS` array and `RESOLUTION_SECONDS` map
- **More layout modes**: extend `layout` state in App.jsx (e.g. `'triple'`, `'quad'`, vertical splits) — the ChartPanel is already fully self-contained
