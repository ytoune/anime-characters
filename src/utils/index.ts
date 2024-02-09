/* eslint-disable import/no-deprecated */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Observable } from 'rxjs'

import { BehaviorSubject, combineLatest, of, isObservable } from 'rxjs'
import { map, switchMap, shareReplay } from 'rxjs/operators'

export const combine = <T extends Record<string, unknown>>(
  dict: T,
): Observable<{
  [K in keyof T]: T[K] extends Observable<infer U> ? U : T[K]
}> => {
  const keys = Object.keys(dict)
  return combineLatest(
    keys.map(key => {
      const r = dict[key]
      return isObservable(r) ? r : of(r)
    }),
  ).pipe(
    map(vals =>
      vals.reduce((dict: any, val, i) => ({ ...dict, [keys[i]!]: val }), {}),
    ),
  ) as any
}

export const createState = <T>(
  def: T,
): [BehaviorSubject<T>, (p: T) => void] => {
  const sub = new BehaviorSubject(def)
  return [sub, p => sub.next(p)]
}

export const createCache = <T, K>({ timeout }: { timeout?: number } = {}): {
  remove: (key: K) => void
  select: (key: K, get: () => Observable<T>) => Observable<T>
} => {
  let num = 0
  const [pin, push] = createState(num)
  const cachem = new Map<K, Observable<T>>()
  const cachew = new WeakMap<K, Observable<T>>()
  const find = (key: K) => (key && 'object' === typeof key ? cachew : cachem)
  const select = (key: K, get: () => Observable<T>): Observable<T> => {
    const cache = find(key)
    if (cache.has(key)) return cache.get(key) as Observable<T>
    const val = get()
    cache.set(key, val)
    if (timeout) setTimeout(() => cache.delete(key), timeout)
    return val
  }
  return {
    remove: key => {
      const cache = find(key)
      cache.delete(key)
      push(++num)
    },
    select: (key, get) =>
      pin.pipe(switchMap(() => select(key, () => get().pipe(shareReplay(1))))),
  }
}
