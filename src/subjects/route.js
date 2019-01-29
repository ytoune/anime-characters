import createRouter from 'router5'
import browserPlugin from 'router5-plugin-browser'
import createObservables from 'rxjs-router5'
import { shareReplay } from 'rxjs/operators'

/**
 * @type {import("router5").Route[]}
 */
const routes = [
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
const cache = new Map()

export const route = route$.pipe(shareReplay(1))
export const routeNode = s => {
	if (!cache.has(s)) cache.set(s, routeNodeF(s))
	return cache.get(s)
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
export const pushState = (name, params, opts) =>
	router.isActive(name, params)
		? Promise.resolve(router.getState())
		: new Promise((res, rej) =>
				router.navigate(name, params, opts, (e, s) => (e ? rej(e) : res(s))),
		  )

router.start()
