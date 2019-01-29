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
} from 'rxjs/operators'

import { route, pushState } from './route'

const ROOT = 'https://api.jikan.moe/v3'

export const isLoading = new BehaviorSubject(false)

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
			startWith(null),
			tap(v => isLoading.next(!v)),
		),
	),
	filter(Boolean),
	map(r => r.results),
	shareReplay(1),
	startWith([]),
)
