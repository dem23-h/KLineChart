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

import { formatValue } from '../../common/utils/format'
import { isValid } from '../../common/utils/typeChecks'

import type { IndicatorTemplate, IndicatorFigure } from '../../component/Indicator'

interface Vol {
  open: number
  close: number
  // `session` is copied from the source KLineData so the bar's styles
  // callback can recolor extended-hours volume bars in the muted tone
  // — same rule the candle pane uses (see CandleBarView). Optional
  // because it's only set by feeds that emit a session field.
  session?: 'regular' | 'extended'
  volume?: number
  ma1?: number
  ma2?: number
  ma3?: number
}

/**
 * Match the candle pane's extended-hours palette so volume bars don't
 * fight the chart visually. Hardcoded here because Indicator styles
 * don't see candle styles, and threading them through would touch every
 * indicator. If themes ever expose a session-color knob this becomes a
 * lookup; until then a sensible default is fine.
 */
const EXTENDED_BAR_COLOR = '#ffffff'

function getVolumeFigure (): IndicatorFigure<Vol> {
  return {
    key: 'volume',
    title: 'VOLUME: ',
    type: 'bar',
    baseValue: 0,
    styles: ({ data, indicator, defaultStyles }) => {
      const current = data.current
      let color = formatValue(indicator.styles, 'bars[0].noChangeColor', (defaultStyles!.bars)[0].noChangeColor)
      if (isValid(current)) {
        if (current.session === 'extended') {
          color = EXTENDED_BAR_COLOR
        } else if (current.close > current.open) {
          color = formatValue(indicator.styles, 'bars[0].upColor', (defaultStyles!.bars)[0].upColor)
        } else if (current.close < current.open) {
          color = formatValue(indicator.styles, 'bars[0].downColor', (defaultStyles!.bars)[0].downColor)
        }
      }
      return { color: color as string }
    }
  }
}

const volume: IndicatorTemplate<Vol, number> = {
  name: 'VOL',
  shortName: 'VOL',
  series: 'volume',
  calcParams: [5, 10, 20],
  shouldFormatBigNumber: true,
  precision: 0,
  minValue: 0,
  figures: [
    { key: 'ma1', title: 'MA5: ', type: 'line' },
    { key: 'ma2', title: 'MA10: ', type: 'line' },
    { key: 'ma3', title: 'MA20: ', type: 'line' },
    getVolumeFigure()
  ],
  regenerateFigures: (params) => {
    const figures: Array<IndicatorFigure<Vol>> = params.map((p, i) => ({ key: `ma${i + 1}`, title: `MA${p}: `, type: 'line' }))
    figures.push(getVolumeFigure())
    return figures
  },
  calc: (dataList, indicator) => {
    const { calcParams: params, figures } = indicator
    const volSums: number[] = []
    return dataList.map((kLineData, i) => {
      const volume = kLineData.volume ?? 0
      // Forward the bar's session into the Vol row so the styles
      // callback above can match the candle pane's session-aware
      // colouring. Cast through unknown because KLineData's index
      // signature returns `unknown`.
      const session = kLineData.session as 'regular' | 'extended' | undefined
      const vol: Vol = { volume, open: kLineData.open, close: kLineData.close, session }
      params.forEach((p, index) => {
        volSums[index] = (volSums[index] ?? 0) + volume
        if (i >= p - 1) {
          vol[figures[index].key] = volSums[index] / p
          volSums[index] -= (dataList[i - (p - 1)].volume ?? 0)
        }
      })
      return vol
    })
  },
  // LAST_BAR fast path: only the rightmost bar changed, so the tail row
  // is the bar's own volume/open/close/session plus each MA recomputed
  // as a windowed sum over the last `p` bars — O(Σp), no full-list walk.
  calcTail: (dataList, indicator) => {
    const { calcParams: params, figures } = indicator
    const i = dataList.length - 1
    const kLineData = dataList[i]
    const volume = kLineData.volume ?? 0
    const session = kLineData.session as 'regular' | 'extended' | undefined
    const vol: Vol = { volume, open: kLineData.open, close: kLineData.close, session }
    params.forEach((p, index) => {
      if (i >= p - 1) {
        let sum = 0
        for (let j = i - (p - 1); j <= i; j++) {
          sum += dataList[j].volume ?? 0
        }
        vol[figures[index].key] = sum / p
      }
    })
    return vol
  }
}

export default volume
