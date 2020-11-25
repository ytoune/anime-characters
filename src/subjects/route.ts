import createRouter from 'router5'
import browserPlugin from 'router5-plugin-browser'
import createObservables from 'rxjs-router5'
import { shareReplay } from 'rxjs/operators'

import type { Observable } from 'rxjs'
import type { Route, State } from 'router5'

import type {
	Params,
	NavigationOptions,
	// DoneFn,
	State as BState,
} from 'router5/dist/types/base'

/**
 * @type {import("router5").Route[]}
 */
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

/**
 * @typedef {import("router5/types/types/base").Params} Params
 * @typedef {import("router5/types/types/base").NavigationOptions} NavigationOptions
 * @typedef {import("router5/types/types/base").DoneFn} DoneFn
 * @typedef {import("router5/types/types/base").State} State
 */
/** @type {(routeName: string, params?: Params, options?: NavigationOptions) => Promise<State>} */
export const pushState = (
	name: string,
	params: Params = {},
	opts: NavigationOptions = {},
): Promise<BState> =>
	router.isActive(name, params)
		? Promise.resolve(router.getState())
		: new Promise((res, rej) =>
				router.navigate(name, params, opts, (e, s) => (e ? rej(e) : res(s))),
		  )

router.start()
