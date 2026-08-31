/** The A2UI v1.0 standard function set, grouped by role. */
import type { FunctionInput } from '../types.js'
import { FORMAT_FUNCTIONS } from './format.js'
import { LOGIC_FUNCTIONS } from './logic.js'
import { SYSTEM_FUNCTIONS } from './system.js'
import { VALIDATION_FUNCTIONS } from './validation.js'

export { FORMAT_FUNCTIONS, interpolate } from './format.js'
export { LOGIC_FUNCTIONS } from './logic.js'
export { SYSTEM_FUNCTIONS } from './system.js'
export { VALIDATION_FUNCTIONS } from './validation.js'

export const STANDARD_FUNCTIONS: FunctionInput[] = [...FORMAT_FUNCTIONS, ...VALIDATION_FUNCTIONS, ...LOGIC_FUNCTIONS, ...SYSTEM_FUNCTIONS]
