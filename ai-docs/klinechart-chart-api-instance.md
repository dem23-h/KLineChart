# KLineChart — Chart API Reference (v10.0.0-beta1)

---

## `init(ds, options?)`

Initializes a chart. Wait until the container DOM is ready before calling.

```ts
(
  ds: string | HTMLElement,
  options?: {
    layout?: Array<{
      type: 'candle' | 'indicator' | 'xAxis'
      content?: Array<Indicator | string>
      options?: {
        id?: string
        height?: number
        minHeight?: number
        dragEnabled?: boolean
        order?: number
        state?: 'normal' | 'maximize' | 'minimize'
        axis?: {
          name?: string
          reverse?: boolean
          inside?: boolean
          position?: 'left' | 'right'
          scrollZoomEnabled?: boolean
          gap?: { top?: number; bottom?: number }
          createRange?: (params: object) => { from: number; to: number; range: number; realFrom: number; realTo: number; realRange: number; displayFrom: number; displayTo: number; displayRange: number }
          createTicks?: (params: object) => Array<{ coord: number; value: number | string; text: string }>
        }
      }
    }>
    locale?: string
    styles?: string | Styles
    timezone?: string
    formatter?: {
      formatDate?: (params: { dateTimeFormat: Intl.DateTimeFormat; timestamp: number; template: string; type: 'tooltip' | 'crosshair' | 'xAxis' }) => string
      formatBigNumber?: (value: string | number) => string
    }
    thousandsSeparator?: {
      sign?: string
      format: (value: number | string) => string
    }
    decimalFold?: {
      threshold?: number
      format?: (value: number | string) => string
    }
    zoomAnchor?: 'cursor' | 'last_bar' | { main?: 'cursor' | 'last_bar'; xAxis?: 'cursor' | 'last_bar' }
  }
) => Chart
```

**Parameters:**

- `ds` — Container DOM element or element id.
- `options` — Optional config:
  - `layout` — Custom pane layout array. Each item has `type` (`candle` / `indicator` / `xAxis`), optional `content` (indicators), and `options` (id, height, minHeight, dragEnabled, order, state, axis config).
  - `locale` — Built-in: `zh-CN`, `en-US`.
  - `timezone` — e.g. `Asia/Shanghai`. Defaults to local timezone.
  - `styles` — A registered style name or a `Styles` object (incremental).
  - `formatter` — `formatDate` and `formatBigNumber` callbacks.
  - `thousandsSeparator` — `sign` and `format` callback.
  - `decimalFold` — `threshold` and `format` callback for folding trailing zeros.
  - `zoomAnchor` — `'cursor'` or `'last_bar'`.

**Returns:** `Chart` instance.

---

## `dispose(dcs)`

Destroys a chart instance.

```ts
(dcs: HTMLElement | Chart | string) => void
```

- `dcs` — Chart instance, DOM element, or element id.

---

## `version()`

Returns the current library version string.

```ts
() => string
```

---

## `registerLocale(locale, locales)`

Registers a custom locale for chart labels.

```ts
(
  locale: string,
  locales: {
    time: string; open: string; high: string; low: string; close: string;
    volume: string; change: string; turnover: string;
    second: string; minute: string; hour: string; day: string;
    week: string; month: string; year: string
  }
) => void
```

---

## `getSupportedLocales()`

Returns the list of currently registered locale names.

```ts
() => string[]
```

---

## `registerStyles(name, styles)`

Registers a named style template. Supports incremental style overrides.

```ts
(name: string, styles: Styles) => void
```

- `name` — Template name (used in `init` or `setStyles`).
- `styles` — A `Styles` object. See the [Styles guide](https://klinecharts.com/en-US/guide/styles).

---

## `registerFigure(figure)`

Registers a custom drawing figure for use in indicators and overlays.

```ts
(
  figure: {
    name: string
    draw: (ctx: CanvasRenderingContext2D, attrs: any, styles: object) => void
    checkEventOn: (coordinate: Coordinate, attrs: any, styles: object) => boolean
  }
) => void
```

- `name` — Unique identifier.
- `draw` — Rendering method using Canvas 2D context.
- `checkEventOn` — Hit-testing method.

---

## `getSupportedFigures()`

Returns the list of registered figure names.

```ts
() => string[]
```

---

## `getFigureClass(name)`

Returns the Figure class for a given figure name.

```ts
(name: string) => Figure
```

---

## `registerIndicator(indicator)`

Registers a custom technical indicator.

```ts
(
  indicator: {
    name: string
    shortName?: string
    precision?: number
    calcParams?: unknown[]
    shouldOhlc?: boolean
    shouldFormatBigNumber?: boolean
    visible?: boolean
    zLevel?: number
    extendData?: unknown
    series?: 'normal' | 'price' | 'volume'
    figures?: Array<{
      key: string
      title?: string
      type?: string
      baseValue?: number
      attrs?: (params: object) => object
      styles?: (params: object) => object
    }>
    minValue?: number
    maxValue?: number
    styles?: Partial<IndicatorStyle>
    shouldUpdate?: (prev: Indicator, current: Indicator) => boolean | { calc: boolean; draw: boolean }
    calc: (kLineDataList: KLineData[], indicator: Indicator) => Record<Timestamp, unknown> | Promise<Record<Timestamp, unknown>>
    regenerateFigures?: (calcParams: unknown[]) => Array</* same as figures */>
    createTooltipDataSource?: (params: object) => { name?: string; calcParamsText?: string; features?: Array<object>; legends?: Array<{ title: string | { text: string; color: string }; value: string | { text: string; color: string } }> }
    draw?: (params: object) => boolean
    onDataStateChange?: (params: object) => void
  }
) => void
```

**Key parameters:**

- `name` — Unique identifier.
- `series` — `'normal'`, `'price'`, or `'volume'`. Affects default precision.
- `figures` — Array of figure configs with `key`, `type`, optional `baseValue`, `attrs`, `styles`.
- `calc` — Calculation function (can be async).
- `createTooltipDataSource` — Custom tooltip content.
- `draw` — Custom draw method; return `true` to override default rendering.

---

## `getSupportedIndicators()`

Returns the list of registered indicator names.

```ts
() => string[]
```

---

## `registerOverlay(overlay)`

Registers a custom overlay (drawing tool).

```ts
(
  overlay: {
    name: string
    totalStep?: number
    lock?: boolean
    visible?: boolean
    zLevel?: number
    needDefaultPointFigure?: boolean
    needDefaultXAxisFigure?: boolean
    needDefaultYAxisFigure?: boolean
    mode?: 'normal' | 'weak_magnet' | 'strong_magnet'
    modeSensitivity?: number
    points?: Array<{ timestamp: number; dataIndex?: number; value?: number }>
    extendData?: any
    styles?: object
    createPointFigures?: (params: object) => FigureConfig | FigureConfig[]
    createXAxisFigures?: (params: object) => FigureConfig | FigureConfig[]
    createYAxisFigures?: (params: object) => FigureConfig | FigureConfig[]
    performEventPressedMove?: (params: object) => void
    performEventMoveForDrawing?: (params: object) => void
    // Event callbacks (all return boolean):
    onDrawStart? / onDrawing? / onDrawEnd?
    onClick? / onDoubleClick? / onRightClick?
    onPressedMoveStart? / onPressedMoving? / onPressedMoveEnd?
    onMouseEnter? / onMouseLeave?
    onRemoved? / onSelected? / onDeselected?
  }
) => void
```

**Key parameters:**

- `name` — Unique identifier.
- `totalStep` — Number of clicks/steps to complete drawing.
- `mode` — `'normal'`, `'weak_magnet'`, or `'strong_magnet'` for snapping behavior.
- `createPointFigures` / `createXAxisFigures` / `createYAxisFigures` — Generate figure configs for rendering.

---

## `getSupportedOverlays()`

Returns the list of registered overlay names.

```ts
() => string[]
```

---

## `registerXAxis(xAxis)`

Registers a custom X-axis.

```ts
(
  xAxis: {
    name: string
    scrollZoomEnabled?: boolean
    createTicks?: (params: object) => Array<{ coord: number; value: number | string; text: string }>
  }
) => void
```

---

## `registerYAxis(yAxis)`

Registers a custom Y-axis with full control over value transformations and tick generation.

```ts
(
  yAxis: {
    name: string
    reverse?: boolean
    inside?: boolean
    position?: 'left' | 'right'
    scrollZoomEnabled?: boolean
    gap?: { top?: number; bottom?: number }
    valueToRealValue?: (value: number, params: object) => number
    realValueToDisplayValue?: (value: number, params: object) => number
    displayValueToRealValue?: (value: number, params: object) => number
    realValueToValue?: (value: number, params: object) => number
    displayValueToText?: (value: number, precision: number) => string
    minSpan?: (precision: number) => number
    createRange?: (params: object) => { from: number; to: number; range: number; realFrom: number; realTo: number; realRange: number; displayFrom: number; displayTo: number; displayRange: number }
    createTicks?: (params: object) => Array<{ coord: number; value: number | string; text: string }>
  }
) => void
```

---

## `utils`

Collection of utility methods available on `klinecharts.utils`.

| Method | Signature | Description |
|---|---|---|
| `clone(target)` | `(any) => any` | Deep copy |
| `merge(target, source)` | `(object, object) => void` | Merge source into target |
| `isString(value)` | `(any) => boolean` | Type check |
| `isNumber(value)` | `(any) => boolean` | Type check |
| `isValid(value)` | `(any) => boolean` | Checks if value is valid (not null/undefined) |
| `isObject(value)` | `(any) => boolean` | Type check |
| `isFunction(value)` | `(any) => boolean` | Type check |
| `isBoolean(value)` | `(any) => boolean` | Type check |
| `formatValue(data, key, defaultValue?)` | `(any, string, any?) => any` | Nested property access (e.g. `'a.b.c'`) |
| `formatPrecision(value, precision?)` | `(string\|number, number?) => string` | Format decimal precision |
| `formatBigNumber(value)` | `(string\|number) => string` | e.g. 1000 → `1k`, 1000000 → `1M` |
| `formatDate(dateTimeFormat, timestamp, format)` | `(Intl.DateTimeFormat, number, string) => string` | Format date with template like `'YYYY-MM-DD HH:mm:ss'` |
| `formatThousands(value, sign)` | `(string\|number, string) => string` | Add thousands separators |
| `formatFoldDecimal(value, threshold)` | `(string\|number, number) => string` | Fold trailing decimal zeros (v9.8.0+) |
| `calcTextWidth(text, size?, weight?, family?)` | `(string, number?, string\|number?, string?) => number` | Measure text pixel width (v9.3.0+) |
| `getLinearSlopeIntercept(c1, c2)` | `(Coordinate, Coordinate) => [k, b]` | Get slope & intercept of line `y = kx + b` |
| `getLinearYFromCoordinates(c1, c2, target)` | `(Coord, Coord, Coord) => number` | Get Y on line through two points |
| `getLinearYFromSlopeIntercept(kb, target)` | `(number[], Coord) => number` | Get Y from slope+intercept |
| `checkCoordinateOnArc(coord, arc)` | `(Coord, {x,y,r,startAngle,endAngle}) => boolean` | Hit test: arc |
| `checkCoordinateOnCircle(coord, circle)` | `(Coord, {x,y,r}) => boolean` | Hit test: circle |
| `checkCoordinateOnLine(coord, line)` | `(Coord, {coordinates}) => boolean` | Hit test: polyline |
| `checkCoordinateOnPolygon(coord, polygon)` | `(Coord, {coordinates}) => boolean` | Hit test: polygon |
| `checkCoordinateOnRect(coord, rect)` | `(Coord, {x,y,width,height}) => boolean` | Hit test: rectangle |
| `checkCoordinateOnText(coord, text, styles)` | `(Coord, TextParams, StyleParams) => boolean` | Hit test: text |
