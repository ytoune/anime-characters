import {
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { State } from '../subjects/route'
import { route } from '../subjects/route'
import type { Character } from '../subjects/search'
import { search, query, pushquery, isLoading, errors } from '../subjects/search'

const handleQuery = (e: { readonly target: EventTarget }) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  )
    pushquery(e.target.value)
}

const Img = ({ ...p }: { src: string }) => (
  <img style={{ maxHeight: '100px' }} {...p} />
)
const Link = ({ ...props }: { href: string; children: ReactNode }) => (
  <a target="_blank" rel="noopener noreferrer" {...props} />
)
type IndexViewProps = Readonly<{
  route: { readonly name: string }
  search: readonly Character[]
  query: string
  isLoading: boolean
  errors: readonly string[]
}>
const IndexView = ({
  route,
  search,
  query,
  isLoading,
  errors,
}: {
  route: { readonly name: string }
  search: readonly Character[]
  query: string
  isLoading: boolean
  errors: readonly string[]
}) => (
  <div>
    <TextField value={query} onChange={handleQuery} />
    {isLoading ? <Typography>isLoading...</Typography> : null}
    {errors && errors.length
      ? errors.map((error, i) => (
          <Typography key={error + i}>{error}</Typography>
        ))
      : null}
    {'home' === route.name ? (
      <Typography>input search name</Typography>
    ) : (
      <List>
        {search.map(item => (
          <ListItem key={item.mal_id}>
            <ListItemAvatar>
              <Img src={item.images.webp.image_url} />
            </ListItemAvatar>
            <ListItemText>
              <Link href={item.url}>{item.name}</Link>
              {item.name_kanji ? (
                <>
                  {' / '}
                  <Link href={item.url}>{item.name_kanji}</Link>
                </>
              ) : null}
            </ListItemText>
            {/* <ListItemText>
              {getAnimeNames(item).map(a => (
                <Link key={a.mal_id} href={a.url}>
                  {a.type}: {a.name}
                </Link>
              ))}
            </ListItemText> */}
          </ListItem>
        ))}
      </List>
    )}
  </div>
)

const filled = (p: Partial<IndexViewProps>): p is IndexViewProps =>
  void 0 !== p.route &&
  void 0 !== p.search &&
  void 0 !== p.query &&
  void 0 !== p.isLoading &&
  void 0 !== p.errors
const Index = () => {
  const [s, set] = useState<Partial<IndexViewProps>>({})
  useEffect(() => {
    const r = route.subscribe(route => set(s => ({ ...s, route })))
    const s = search.subscribe(search => set(s => ({ ...s, search })))
    const q = query.subscribe(query => set(s => ({ ...s, query })))
    const i = isLoading.subscribe(isLoading => set(s => ({ ...s, isLoading })))
    const e = errors.subscribe(errors => set(s => ({ ...s, errors })))
    return () => {
      r.unsubscribe()
      s.unsubscribe()
      q.unsubscribe()
      i.unsubscribe()
      e.unsubscribe()
    }
  }, [])
  return filled(s) ? <IndexView {...s} /> : null
}

const NotFound = () => <div>not found</div>

const Route = () => {
  const [rt, set] = useState<State | undefined>()
  useEffect(() => {
    const r = route.subscribe(route => set(() => route))
    return () => r.unsubscribe()
  }, [])
  if (!rt) return null

  switch (rt.name) {
    case 'home':
    case 'home/search':
      return <Index />
    default:
      return <NotFound />
  }
}

export default Route
