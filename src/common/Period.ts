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

export type PeriodType = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export interface Period {
  type: PeriodType
  span: number
}

export const PeriodTypeXAxisFormat: Record<PeriodType, string> = {
  second: 'HH:mm:ss',
  minute: 'HH:mm',
  hour: 'MM-DD HH:mm',
  day: 'YYYY-MM-DD',
  week: 'YYYY-MM-DD',
  month: 'YYYY-MM',
  year: 'YYYY'
}

// `ddd` (weekday) is deliberately absent from week/month/year:
// - week: the timestamp is a bucket boundary, not a trading day, so the weekday
//   is a constant artifact of the anchor and says nothing about the bar. The
//   anchor is not even stable across feeds: the engine's aggregation path uses
//   Monday 00:00 ET, while the mock provider emits Wednesday 20:00 ET.
// - month/year: no day-of-month is displayed, so a weekday would be meaningless.
export const PeriodTypeCrosshairTooltipFormat: Record<PeriodType, string> = {
  second: 'ddd HH:mm:ss',
  minute: 'ddd YYYY-MM-DD HH:mm',
  hour: 'ddd YYYY-MM-DD HH:mm',
  day: 'ddd YYYY-MM-DD',
  week: 'YYYY-MM-DD',
  month: 'YYYY-MM',
  year: 'YYYY'
}
