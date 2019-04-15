import { ajax } from 'rxjs/ajax'
import { BehaviorSubject } from 'rxjs'
import {
	filter,
	switchMap,
	distinctUntilChanged,
	shareReplay,
	startWith,
	map,
	tap,
	debounceTime,
	catchError,
} from 'rxjs/operators'

import { route, pushState } from './route'

const ROOT = 'https://api.jikan.moe/v3'

export const isLoading = new BehaviorSubject(false)
/** @type {BehaviorSubject<string[]>} */
export const errors = new BehaviorSubject([])

const e = encodeURIComponent

export const query = route.pipe(
	filter(q => q && 'home/search' === q.name),
	map(q => q.params.query),
	startWith(''),
	distinctUntilChanged(),
	shareReplay(1),
)
export const pushquery = word => pushState('home/search', { query: word })
export const search = query.pipe(
	filter(Boolean),
	debounceTime(1000),
	distinctUntilChanged(),
	switchMap(q =>
		ajax.getJSON(`${ROOT}/search/character?q=${e(q)}&page=1`).pipe(
			catchError(x => {
				if (x && 400 <= x.status && x.status < 500) {
					const t = x.xhr && x.xhr.statusText
					return {
						errors: ['string' === typeof t ? t : 'Not Found'],
					}
				}
				return { errors: ['something happen.'] }
			}),
			startWith(null),
			tap(v => {
				isLoading.next(!v)
				if (
					v &&
					v.errors &&
					Array.isArray(v.errors) &&
					v.errors.every(e => 'string' === typeof e)
				)
					errors.next(v.errors)
				else errors.next([])
			}),
		),
	),
	filter(Boolean),
	map(r => (Array.isArray(r && r.results) ? r.results : [])),
	shareReplay(1),
	startWith([]),
)
