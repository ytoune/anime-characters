// @ts-nocheck

import type { Observable } from 'rxjs'
import type { ObservableConfig, mapper, ComponentEnhancer } from 'recompose'

/**
 * @template S
 * @typedef {import("rxjs").Observable<S>} Observable<S>
 */
import { compose, mapPropsStreamWithConfig } from 'recompose'
import { BehaviorSubject, combineLatest, of, isObservable, from } from 'rxjs'
import { map, switchMap, shareReplay } from 'rxjs/operators'

export { compose }

/**
 * @type {<T extends {}>(obj: T) => Observable<{
     [K in keyof T]: T[K] extends Observable<infer U>
     ? U : T[K]
   }>}
 */
export const combine = <T extends Record<string, unknown>>(
	dict: T,
): Observable<
	{
		[K in keyof T]: T[K] extends Observable<infer U> ? U : T[K]
	}
> => {
	const keys = Object.keys(dict)
	return map(vals =>
		vals.reduce((dict, val, i) => ({ ...dict, [keys[i]]: val }), {}),
	)(
		combineLatest(
			keys.map(key => {
				const r = dict[key]
				return isObservable(r) ? r : of(r)
			}),
		),
	)
}

/**
 * @template T
 * @type {<T>(def: T) => [import("rxjs").BehaviorSubject<T>, (p: T) => void]}
 */
export const createState = <T>(
	def: T,
): [BehaviorSubject<T>, (p: T) => void] => {
	const sub = new BehaviorSubject(def)
	return [sub, p => sub.next(p)]
}

/**
 * @template T, K
 * @type {<T, K>({timeout}?: {timeout?: number}) => {
     remove: (key: K) => void
     select: (key: K, get: () => Observable<T>) => Observable<T>
   }}
 */
export const createCache = <T, K>({ timeout }: { timeout?: number } = {}): {
	remove: (key: K) => void
	select: (key: K, get: () => Observable<T>) => Observable<T>
} => {
	let num = 0
	const [pin, push] = createState(num)
	const cachem = new Map()
	const cachew = new WeakMap()
	const find = key => (key && 'object' === typeof key ? cachew : cachem)
	const select = (key, get) => {
		const cache = find(key)
		if (cache.has(key)) return cache.get(key)
		const val = get()
		cache.set(key, val)
		if (0 < timeout) setTimeout(() => cache.delete(key), timeout)
		return val
	}
	return {
		remove: key => {
			const cache = find(key)
			cache.delete(key)
			push(++num)
		},
		select: (key, get) =>
			switchMap(() => select(key, () => shareReplay(1)(get())))(pin),
	}
}

// https://github.com/ReactiveX/rxjs/issues/4415
/** @type {<P, S>(r: (a: P, ...b: *[]) => S) => (a: P) => S} */
const fix: <P, S>(r: (a: P, ...b: unknown[]) => S) => (a: P) => S = (() => {
	const make = k => {
		const s1 = ('function' === typeof Symbol && Symbol[k]) || '@@' + k
		const s2 =
			('function' === typeof Symbol && (Symbol[k] || Symbol(k))) || '@@' + k
		return [s1, s2]
	}
	const [o1, o2] = make('observable')
	const [i1, i2] = make('iterator')
	if (o1 === o2) return fn => fn
	const list = [
		[o1, o2],
		[o2, o1],
		[i1, i2],
		[i2, i1],
	]
	return fn => r => {
		if (r)
			for (const [k1, k2] of list)
				if ('function' === typeof r[k2] && 'undefined' === typeof r[k1])
					r[k1] = r[k2]
		return fn(r)
	}
})()
/** @type {import("recompose").ObservableConfig} */
const config: ObservableConfig = {
	fromESObservable: fix(from),
	toESObservable: fix(stream => stream),
}
export const mapPropsStream = mapPropsStreamWithConfig(config)

/**
 * @template T, S
 * @param {import("recompose").mapper<Observable<T>, Observable<S>>} fn
 * @returns {import("recompose").ComponentEnhancer<T & S, T>}
 */
export const appendPropsStream = <T, S>(
	fn: mapper<Observable<T>, Observable<S>>,
): ComponentEnhancer<T & S, T> =>
	mapPropsStream((/** @param {Observable<T>} p */ p: Observable<T>) =>
		combineLatest([p, fn(p), (p, o) => ({ ...p, ...o })]),
	)
