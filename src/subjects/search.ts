import { ajax } from 'rxjs/ajax'
import { BehaviorSubject, Observable, of } from 'rxjs'
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
export const errors = new BehaviorSubject<string[]>([])

const e = encodeURIComponent

export const query = route.pipe(
	filter(q => q && 'home/search' === q.name),
	map(q => String(q.params.query)),
	startWith(''),
	distinctUntilChanged(),
	shareReplay(1),
)
export const pushquery = (word: string) =>
	pushState('home/search', { query: word })

export type Anime = {
	mal_id: number
	name: string
	type: 'anime'
	url: string
}
export type Manga = {
	mal_id: number
	name: string
	type: 'manga'
	url: string
}
export type Character = {
	alternative_names: string[]
	anime: Anime[]
	image_url: string
	mal_id: number
	manga: Manga[]
	name: string
	url: string
}

type Response =
	| {
			results?: undefined
			errors: string[]
	  }
	| {
			results: Character[]
			errors?: undefined
	  }

export const search = query.pipe(
	filter<string>(Boolean),
	debounceTime(1000),
	distinctUntilChanged(),
	switchMap(q =>
		ajax.getJSON<Response>(`${ROOT}/search/character?q=${e(q)}&page=1`).pipe(
			catchError(x => {
				if (x && 400 <= x.status && x.status < 500) {
					const t = x.xhr && x.xhr.statusText
					return of({ errors: ['string' === typeof t ? t : 'Not Found'] })
				}
				return of({ errors: ['something happen.'] })
			}),
			startWith(null),
			tap((v: Response | null) => {
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
	filter<Response | null>(Boolean),
	map(r => (r?.results && Array.isArray(r.results) ? r.results : [])),
	shareReplay(1),
	startWith([]),
)
