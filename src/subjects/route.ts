import createRouter from 'router5'
import browserPlugin from 'router5-plugin-browser'
import createObservables from 'rxjs-router5'
import { shareReplay } from 'rxjs/operators'

import type { Observable } from 'rxjs'
import type { Route, State } from 'router5'

import type { Params, NavigationOptions } from 'router5/dist/types/base'

const routes: Route[] = [
	{ name: 'home', path: '/' },
	{ name: 'home/search', path: '/q/*query' },
]

const router = createRouter(routes)

router.usePlugin(browserPlugin({ useHash: true }))

const {
	route$,
	routeNode: routeNodeF,
	transitionError$,
	transitionRoute$,
} = createObservables(router)

/** @type {Map<string, import("rxjs").Observable<import("router5").State>>} */
const cache = new Map<string, Observable<State>>()

export const route = route$.pipe(shareReplay(1))
export const routeNode = (s: string) => {
	if (!cache.has(s)) cache.set(s, routeNodeF(s))
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return cache.get(s)!
}
export const transitionError = transitionError$.pipe(shareReplay(1))
export const transitionRoute = transitionRoute$.pipe(shareReplay(1))

export default route

route.subscribe(Boolean)

export const pushState = (
	name: string,
	params: Params = {},
	opts: NavigationOptions = {},
): Promise<State> =>
	router.isActive(name, params)
		? Promise.resolve(router.getState())
		: new Promise((res, rej) =>
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				router.navigate(name, params, opts, (e, s) => (e ? rej(e) : res(s!))),
		  )

router.start()
