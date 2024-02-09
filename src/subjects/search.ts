/* eslint-disable import/no-deprecated */
import { ajax } from 'rxjs/ajax'
import type { Observable } from 'rxjs'
import { BehaviorSubject, of } from 'rxjs'
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

const ROOT = 'https://api.jikan.moe/v4'

export const isLoading = new BehaviorSubject(false)
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
  // alternative_names: string[]
  // anime: Anime[]
  // image_url: string
  // mal_id: number
  // manga: Manga[]
  // name: string
  // url: string

  mal_id: number
  url: string
  images: {
    jpg: {
      image_url: string
      small_image_url: string
    }
    webp: {
      image_url: string
      small_image_url: string
    }
  }
  name: string
  name_kanji: string
  nicknames: string[]
  favorites: number
  about: string
}

type Response =
  | {
      data?: undefined
      errors: string[]
    }
  | {
      data: Character[]
      errors?: undefined
    }

export const search: Observable<Character[]> = query.pipe(
  filter<string>(Boolean),
  debounceTime(1000),
  distinctUntilChanged(),
  switchMap(q =>
    ajax.getJSON<Response>(`${ROOT}/characters?q=${e(q)}&page=1`).pipe(
      catchError(x => {
        if (x && 400 <= x.status && 500 > x.status) {
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
  map(r => (r?.data && Array.isArray(r.data) ? r.data : [])),
  shareReplay(1),
  startWith([]),
)
