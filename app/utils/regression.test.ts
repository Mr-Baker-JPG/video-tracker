import { describe, expect, test } from 'vitest'
import { bestFitFunction } from './regression.ts'

describe('bestFitFunction', () => {
	test('returns null when insufficient points', () => {
		const result = bestFitFunction([{ x: 0, y: 1 }], 'linear')
		expect(result).toBeNull()
	})

	test('fits a linear model correctly', () => {
		const points = [
			{ x: 0, y: 2 },
			{ x: 1, y: 4 },
			{ x: 2, y: 6 },
		]
		const result = bestFitFunction(points, 'linear')
		expect(result).not.toBeNull()
		expect(result?.coefficients.length).toBe(2)
		// y = 2x + 2 => coefficients ~ [2, 2]
		expect(result?.coefficients[0]).toBeCloseTo(2, 3)
		expect(result?.coefficients[1]).toBeCloseTo(2, 3)
		expect(result?.r2).toBeCloseTo(1, 5)
		expect(result?.predict(3)).toBeCloseTo(8, 3)
		expect(result?.type).toBe('linear')
	})

	test('fits a quadratic model correctly', () => {
		// y = x^2 + 2x + 3
		const points = [
			{ x: -1, y: 2 },
			{ x: 0, y: 3 },
			{ x: 1, y: 6 },
			{ x: 2, y: 11 },
		]
		const result = bestFitFunction(points, 'quadratic')
		expect(result).not.toBeNull()
		expect(result?.coefficients[0]).toBeCloseTo(3, 3)
		expect(result?.coefficients[1]).toBeCloseTo(2, 3)
		expect(result?.coefficients[2]).toBeCloseTo(1, 3)
		expect(result?.predict(3)).toBeCloseTo(18, 3)
		expect(result?.r2).toBeCloseTo(1, 5)
		expect(result?.type).toBe('quadratic')
	})

	test('fits a cubic model correctly', () => {
		// y = x^3 + 2x^2 + 3x + 4
		const points = [
			{ x: 0, y: 4 },
			{ x: 1, y: 10 },
			{ x: 2, y: 30 },
			{ x: 3, y: 76 },
			{ x: -1, y: 0 },
		]
		const result = bestFitFunction(points, 'cubic')
		expect(result).not.toBeNull()
		expect(result?.coefficients[0]).toBeCloseTo(4, 2)
		expect(result?.coefficients[1]).toBeCloseTo(3, 2)
		expect(result?.coefficients[2]).toBeCloseTo(2, 2)
		expect(result?.coefficients[3]).toBeCloseTo(1, 2)
		expect(result?.type).toBe('cubic')
	})

	test('fits a squareRoot model correctly', () => {
		// y = 2 + 3√x
		const points = [
			{ x: 0, y: 2 },
			{ x: 1, y: 5 },
			{ x: 4, y: 8 },
			{ x: 9, y: 11 },
		]
		const result = bestFitFunction(points, 'squareRoot')
		expect(result).not.toBeNull()
		expect(result?.coefficients[0]).toBeCloseTo(2, 2)
		expect(result?.coefficients[1]).toBeCloseTo(3, 2)
		expect(result?.type).toBe('squareRoot')
	})

	test('squareRoot returns null for negative x values', () => {
		const points = [
			{ x: -1, y: 1 },
			{ x: 0, y: 2 },
			{ x: 1, y: 3 },
		]
		const result = bestFitFunction(points, 'squareRoot')
		expect(result).toBeNull()
	})

	test('fits an inverseSquare model correctly', () => {
		// y = 1 + 2/x²
		const points = [
			{ x: 1, y: 3 },
			{ x: 2, y: 1.5 },
			{ x: 4, y: 1.125 },
			{ x: 8, y: 1.03125 },
		]
		const result = bestFitFunction(points, 'inverseSquare')
		expect(result).not.toBeNull()
		expect(result?.coefficients[0]).toBeCloseTo(1, 1)
		expect(result?.coefficients[1]).toBeCloseTo(2, 1)
		expect(result?.type).toBe('inverseSquare')
	})

	test('inverseSquare returns null for x = 0', () => {
		const points = [
			{ x: 0, y: 1 },
			{ x: 1, y: 2 },
			{ x: 2, y: 3 },
		]
		const result = bestFitFunction(points, 'inverseSquare')
		expect(result).toBeNull()
	})

	test('fits an exponential model correctly', () => {
		// y = 2·e^(0.5x)
		const points = [
			{ x: 0, y: 2 },
			{ x: 1, y: 2 * Math.exp(0.5) },
			{ x: 2, y: 2 * Math.exp(1) },
			{ x: 3, y: 2 * Math.exp(1.5) },
		]
		const result = bestFitFunction(points, 'exponential')
		expect(result).not.toBeNull()
		expect(result?.coefficients[0]).toBeCloseTo(2, 2)
		expect(result?.coefficients[1]).toBeCloseTo(0.5, 2)
		expect(result?.type).toBe('exponential')
	})

	test('exponential returns null for y <= 0', () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 1, y: 2 },
			{ x: 2, y: 3 },
		]
		const result = bestFitFunction(points, 'exponential')
		expect(result).toBeNull()
	})

	test('handles identical y-values with perfect fit', () => {
		const points = [
			{ x: 0, y: 5 },
			{ x: 1, y: 5 },
			{ x: 2, y: 5 },
			{ x: 3, y: 5 },
		]
		const result = bestFitFunction(points, 'linear')
		expect(result).not.toBeNull()
		expect(result?.coefficients[0]).toBeCloseTo(5, 5)
		expect(result?.coefficients[1]).toBeCloseTo(0, 5)
		expect(result?.r2).toBe(1)
	})

	test('equation formatting works for all types', () => {
		const points = [
			{ x: 0, y: 1 },
			{ x: 1, y: 2 },
			{ x: 2, y: 3 },
		]

		const linear = bestFitFunction(points, 'linear')
		expect(linear?.equation).toContain('y =')
		expect(linear?.equation).toContain('x')

		const quadratic = bestFitFunction(
			[
				{ x: 0, y: 1 },
				{ x: 1, y: 2 },
				{ x: 2, y: 5 },
			],
			'quadratic',
		)
		expect(quadratic?.equation).toContain('x²')

		const squareRoot = bestFitFunction(
			[
				{ x: 0, y: 1 },
				{ x: 1, y: 2 },
				{ x: 4, y: 3 },
			],
			'squareRoot',
		)
		expect(squareRoot?.equation).toContain('√x')

		const inverseSquare = bestFitFunction(
			[
				{ x: 1, y: 1 },
				{ x: 2, y: 2 },
				{ x: 4, y: 3 },
			],
			'inverseSquare',
		)
		expect(inverseSquare?.equation).toContain('/x²')
	})
})
