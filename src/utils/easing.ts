/**
 * Cubic easing in/out - acceleration until halfway, then deceleration
 * @param x Progress between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/**
 * Exponential easing in/out - accelerating from zero velocity
 * @param x Progress between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutExpo(x: number): number {
    return x === 0
        ? 0
        : x === 1
        ? 1
        : x < 0.5
        ? Math.pow(2, 20 * x - 10) / 2
        : (2 - Math.pow(2, -20 * x + 10)) / 2
}

/**
 * Sine easing in/out function
 * @param x Progress between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2
} 