/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { KLineData } from '../Data'
import { formatValue } from './format'

function timestampAt(dataList: KLineData[], index: number): number {
  return formatValue(dataList[index], 'timestamp', 0) as number
}

function lowerBoundByTimestamp(dataList: KLineData[], ts: number): number {
  let lo = 0
  let hi = dataList.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (timestampAt(dataList, mid) < ts) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return lo
}

/**
 * Merge `incoming` bars into `dataList` by timestamp. Mutates
 * `dataList` in place and returns `true` iff anything changed.
 *
 * Rules (`oldest` is the list's first bar before the merge):
 *
 *   1. `ts > rightmost` -> append (so a repeated timestamp replaces instead).
 *   2. exact timestamp match -> replace at that index.
 *   3. `oldest < ts`, no match -> splice at its sorted position.
 *   4. `ts <= oldest`, no match -> drop.
 *
 * The mid-gap splice handles engine cold-open disk paint followed by a
 * warm-all tail batch after the live bar has already advanced the chart's
 * rightmost timestamp.
 */
export function mergeBatchIntoDataList(dataList: KLineData[], incoming: KLineData[]): boolean {
  const sorted = [...incoming].sort((a, b) => a.timestamp - b.timestamp)
  const oldestTs = dataList.length > 0 ? timestampAt(dataList, 0) : Number.POSITIVE_INFINITY
  let changed = false

  for (const bar of sorted) {
    const ts = bar.timestamp
    if (dataList.length === 0 || ts > timestampAt(dataList, dataList.length - 1)) {
      dataList.push(bar)
    } else {
      const idx = lowerBoundByTimestamp(dataList, ts)
      if (idx < dataList.length && timestampAt(dataList, idx) === ts) {
        dataList[idx] = bar
      } else if (ts > oldestTs) {
        dataList.splice(idx, 0, bar)
      } else {
        continue
      }
    }
    changed = true
  }

  return changed
}
