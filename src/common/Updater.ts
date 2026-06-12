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

export const enum UpdateLevel {
  Main,
  Overlay,
  Separator,
  Drawer,
  All
}

/**
 * A rectangle (CSS-pixel coordinates, canvas-local) marking a region that
 * must be cleared + redrawn. Used by the LAST_BAR fast path to bound raster
 * work to the area a live last-bar update can actually change.
 */
export interface InvalidRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Kill switch for the LAST_BAR clipped-repaint fast path (TV_DESIGN_PLAN
 * Phase 2). `false` forces every live update down the FULL path — byte-
 * identical to pre-Phase-2 behaviour. One-knob rollback per plan §15.
 */
export const LAST_BAR_FAST_PATH_ENABLED = true

export default interface Updater {
  update: (level?: UpdateLevel) => void
}
