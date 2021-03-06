// @ts-nocheck

import React from 'react'

import {
	TextField,
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	Typography,
} from '@material-ui/core'
import { combine, appendPropsStream, compose } from '../utils'
import { route } from '../subjects/route'
import { search, query, pushquery, isLoading, errors } from '../subjects/search'

const handleQuery = e => pushquery(e.target.value)
const withRoute = appendPropsStream(() => combine({ route }))
const withQuery = appendPropsStream(() => combine({ query, handleQuery }))
const withSearch = appendPropsStream(() => combine({ search, isLoading }))
const withErrors = appendPropsStream(() => combine({ errors }))

const Img = ({ childrenClassName: _, ...p }) => {
	return <img style={{ maxHeight: '100px' }} {...p} />
}
const Link = ({ childrenClassName: _, ...props }) => (
	<a target="_blank" rel="noopener noreferrer" {...props} />
)
const getAnimeNames = item => {
	return [].concat(item.anime, item.manga)
}
const IndexView = ({
	route,
	search,
	query,
	handleQuery,
	isLoading,
	errors,
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
							<Img src={item.image_url} />
						</ListItemAvatar>
						<ListItemText>
							<Link href={item.url}>{item.name}</Link>
						</ListItemText>
						<ListItemText>
							{getAnimeNames(item).map(a => (
								<Link key={a.mal_id} href={a.url}>
									{a.type}: {a.name}
								</Link>
							))}
						</ListItemText>
					</ListItem>
				))}
			</List>
		)}
	</div>
)
const Index = compose(withRoute, withQuery, withSearch, withErrors)(IndexView)

const NotFound = () => <div>not found</div>

const RouteView = ({ route }) => {
	if (!route) return null

	switch (route.name) {
		case 'home':
		case 'home/search':
			return <Index />
		default:
			return <NotFound />
	}
}
const Route = withRoute(RouteView)

export default Route
