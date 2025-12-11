export type FunctionType =
	| 'linear'
	| 'quadratic'
	| 'cubic'
	| 'exponential'
	| 'inverseSquare'
	| 'squareRoot'

export type Point = { x: number; y: number }

export type RegressionResult = {
	type: FunctionType
	coefficients: number[]
	r2: number | null
	predict: (x: number) => number
	equation: string
}

/**
 * Generic least-squares regression using basis functions.
 * Solves (X^T X)β = X^T y where X is the design matrix from basis functions.
 */
function leastSquares(
	points: Point[],
	basisFns: Array<(x: number) => number>,
): {
	coefficients: number[]
	r2: number | null
	predict: (x: number) => number
} {
	const n = points.length
	if (n < 2) {
		throw new Error('At least two points are required.')
	}

	const p = basisFns.length
	const XTX: number[][] = Array.from({ length: p }, () => Array(p).fill(0))
	const XTy: number[] = Array(p).fill(0)

	let sumY = 0
	for (const { x, y } of points) {
		const phi = basisFns.map((fn) => fn(x))
		sumY += y

		// Build X^T X and X^T y
		for (let i = 0; i < p; i++) {
			XTy[i]! += phi[i]! * y
			for (let j = 0; j < p; j++) {
				XTX[i]![j]! += phi[i]! * phi[j]!
			}
		}
	}

	const coefficients = solveLinearSystem(XTX, XTy)
	if (!coefficients) {
		throw new Error('Matrix is singular; model cannot be fit.')
	}

	const meanY = sumY / n
	let ssTot = 0
	let ssRes = 0

	const predict = (x: number) =>
		basisFns.reduce((acc, fn, i) => acc + coefficients[i]! * fn(x), 0)

	for (const { x, y } of points) {
		const yPred = predict(x)
		ssTot += (y - meanY) ** 2
		ssRes += (y - yPred) ** 2
	}

	const r2 = ssTot === 0 ? null : 1 - ssRes / ssTot

	return { coefficients, r2, predict }
}

/**
 * Solve linear system A * x = b using Gaussian elimination with partial pivoting.
 * Returns null if the system is singular.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
	const n = b.length
	// Deep copy to avoid mutating inputs
	const M = A.map((row) => [...row])
	const y = [...b]

	for (let k = 0; k < n; k++) {
		// Find pivot
		let pivotRow = k
		let maxVal = Math.abs(M[k]![k]!)
		for (let i = k + 1; i < n; i++) {
			const val = Math.abs(M[i]![k]!)
			if (val > maxVal) {
				maxVal = val
				pivotRow = i
			}
		}

		if (maxVal < 1e-12) return null

		// Swap rows if needed
		if (pivotRow !== k) {
			;[M[k], M[pivotRow]] = [M[pivotRow]!, M[k]!]
			;[y[k], y[pivotRow]] = [y[pivotRow]!, y[k]!]
		}

		// Normalize pivot row
		const pivot = M[k]![k]!
		for (let j = k; j < n; j++) {
			M[k]![j]! /= pivot
		}
		y[k]! /= pivot

		// Eliminate below
		for (let i = k + 1; i < n; i++) {
			const factor = M[i]![k]!
			for (let j = k; j < n; j++) {
				M[i]![j]! -= factor * M[k]![j]!
			}
			y[i]! -= factor * y[k]!
		}
	}

	// Back substitution
	const x = new Array(n).fill(0)
	for (let i = n - 1; i >= 0; i--) {
		let sum = 0
		for (let j = i + 1; j < n; j++) {
			sum += M[i]![j]! * x[j]!
		}
		x[i] = y[i]! - sum
	}

	return x
}

/**
 * Fit a function to data points using least-squares regression.
 * Returns null if the fit cannot be computed (insufficient data, invalid constraints, etc.)
 */
export function bestFitFunction(
	points: Point[],
	type: FunctionType,
): RegressionResult | null {
	if (points.length < 2) {
		return null
	}

	try {
		switch (type) {
			case 'linear': {
				// y ≈ a + bx
				const basis = [(x: number) => 1, (x: number) => x]
				const { coefficients, r2, predict } = leastSquares(points, basis)
				return {
					type,
					coefficients,
					r2,
					predict,
					equation: formatEquation(type, coefficients),
				}
			}

			case 'quadratic': {
				// y ≈ a + bx + cx²
				const basis = [(x: number) => 1, (x: number) => x, (x: number) => x * x]
				const { coefficients, r2, predict } = leastSquares(points, basis)
				return {
					type,
					coefficients,
					r2,
					predict,
					equation: formatEquation(type, coefficients),
				}
			}

			case 'cubic': {
				// y ≈ a + bx + cx² + dx³
				const basis = [
					(x: number) => 1,
					(x: number) => x,
					(x: number) => x * x,
					(x: number) => x * x * x,
				]
				const { coefficients, r2, predict } = leastSquares(points, basis)
				return {
					type,
					coefficients,
					r2,
					predict,
					equation: formatEquation(type, coefficients),
				}
			}

			case 'squareRoot': {
				// y ≈ a + b√x
				if (points.some((p) => p.x < 0)) {
					return null // squareRoot requires x >= 0
				}
				const basis = [(x: number) => 1, (x: number) => Math.sqrt(x)]
				const { coefficients, r2, predict } = leastSquares(points, basis)
				return {
					type,
					coefficients,
					r2,
					predict,
					equation: formatEquation(type, coefficients),
				}
			}

			case 'inverseSquare': {
				// y ≈ a + b(1/x²)
				if (points.some((p) => p.x === 0)) {
					return null // inverseSquare requires x ≠ 0
				}
				const basis = [(x: number) => 1, (x: number) => 1 / (x * x)]
				const { coefficients, r2, predict } = leastSquares(points, basis)
				return {
					type,
					coefficients,
					r2,
					predict,
					equation: formatEquation(type, coefficients),
				}
			}

			case 'exponential': {
				// y ≈ a·e^(bx)
				// Transform: ln(y) ≈ ln(a) + bx
				if (points.some((p) => p.y <= 0)) {
					return null // exponential requires y > 0
				}

				const logPoints: Point[] = points.map(({ x, y }) => ({
					x,
					y: Math.log(y),
				}))

				const basis = [(x: number) => 1, (x: number) => x]

				const { coefficients: beta, r2: r2Log } = leastSquares(logPoints, basis)

				const lnA = beta[0]
				const b = beta[1]
				if (lnA === undefined || b === undefined) {
					return null
				}
				const a = Math.exp(lnA)

				// Recompute R² in original y-space
				const n = points.length
				const meanY = points.reduce((acc, p) => acc + p.y, 0) / n

				let ssTot = 0
				let ssRes = 0

				const predict = (x: number) => a * Math.exp(b * x)

				for (const { x, y } of points) {
					const yPred = predict(x)
					ssTot += (y - meanY) ** 2
					ssRes += (y - yPred) ** 2
				}

				const r2 = ssTot === 0 ? null : 1 - ssRes / ssTot

				// Store [a, b] as coefficients
				return {
					type,
					coefficients: [a, b],
					r2,
					predict,
					equation: formatEquation(type, [a, b]),
				}
			}

			default: {
				const _exhaustive: never = type
				return _exhaustive
			}
		}
	} catch (error) {
		// Return null if fit fails (singular matrix, etc.)
		return null
	}
}

function formatEquation(type: FunctionType, coefficients: number[]): string {
	const round = (value: number) => Number(value.toFixed(5))

	switch (type) {
		case 'linear': {
			const a = coefficients[0] ?? 0
			const b = coefficients[1] ?? 0
			return `y = ${round(a)} + ${round(b)}x`
		}

		case 'quadratic': {
			const a = coefficients[0] ?? 0
			const b = coefficients[1] ?? 0
			const c = coefficients[2] ?? 0
			return `y = ${round(a)} + ${round(b)}x + ${round(c)}x²`
		}

		case 'cubic': {
			const a = coefficients[0] ?? 0
			const b = coefficients[1] ?? 0
			const c = coefficients[2] ?? 0
			const d = coefficients[3] ?? 0
			return `y = ${round(a)} + ${round(b)}x + ${round(c)}x² + ${round(d)}x³`
		}

		case 'squareRoot': {
			const a = coefficients[0] ?? 0
			const b = coefficients[1] ?? 0
			return `y = ${round(a)} + ${round(b)}√x`
		}

		case 'inverseSquare': {
			const a = coefficients[0] ?? 0
			const b = coefficients[1] ?? 0
			return `y = ${round(a)} + ${round(b)}/x²`
		}

		case 'exponential': {
			const a = coefficients[0] ?? 0
			const b = coefficients[1] ?? 0
			return `y = ${round(a)}·e^(${round(b)}x)`
		}

		default: {
			const _exhaustive: never = type
			return _exhaustive
		}
	}
}
