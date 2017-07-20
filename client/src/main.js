// import 'babel-polyfill'

import React, { PureComponent } from 'react'
import { render } from 'react-dom'
import { PropTypes } from 'prop-types'

import { BrowserRouter, Route } from 'react-router-dom'

import { createStore, combineActions } from 'reactorx'

import startActions from './actions/start'
import uiActions from './actions/ui'
import configActions from './actions/config'
import treeActions from './actions/tree'
import gatherTreeActions from './actions/gather'
import unraidActions from './actions/unraid'

import Api from './lib/api'
import WSApi from './lib/wsapi'

import App from './components/app'
// import Home from './components/home'
import Scatter from './components/scatter'
import Gather from './components/gather'
import Settings from './components/settings'
import Log from './components/log'

// SAMPLE STATE
// state = {
// 	config: {
// 		folders: [
// 			"movies/films",
// 			"movies/tvshows"
// 		],
// 		dryRun: true
// 	}
// 	unraid: {
// 		condition: {
// 			numDisks: 24,
// 			numProtected: 0,
//			state: "STARTED",
// 		},
// 		disks: [
// 			{id: 1, name: "disk1", path: "/mnt/disk1"},
// 			{id: 2, name: "disk2", path: "/mnt/disk2"},
// 			{id: 3, name: "disk3", path: "/mnt/disk3"},
// 		],
// 		bytesToMove: 0,
// 	}
//  fromDisk: null,
//  toDisk: null,
//  opInProgress: null,
//  transferDisabled: true,
//  lines: [],
// 	tree: {
// 		items:
// 			'/': [
// 				{type: 'folder', path: '/films'}
// 				{type: 'folder', path: '/tvshows'}
// 				{type: 'folder', path: '/storage'}
// 				{type: 'folder', path: '/data'}
// 			],
// 		cache: null,
//		chosen: {},
// 	},
// 	gatherTree: {
// 		items:
// 			'/': [
// 				{type: 'folder', path: '/films'}
// 				{type: 'folder', path: '/tvshows'}
// 				{type: 'folder', path: '/storage'}
// 				{type: 'folder', path: '/data'}
// 			],
// 		cache: null,
//		chosen: {},
// 	},
//	feedback: []
// }

const initialState = {
	config: null,
	unraid: null,
	fromDisk: null,
	toDisk: null,
	opInProgress: null,
	transferDisabled: true,
	validateDisabled: true,
	stats: '',
	lines: [],
	log: [],
	tree: {
		cache: null,
		chosen: {},
		items: [],
	},
	gatherTree: {
		cache: null,
		chosen: {},
		items: [],
		present: [],
		elegible: [],
	},
	feedback: [],
	timeout: null,
}

const actions = combineActions(startActions, uiActions, configActions, treeActions, gatherTreeActions, unraidActions)

const api = new Api()
const ws = new WSApi()

const store = createStore(initialState, actions, { api, ws })

class Layout extends PureComponent {
	static propTypes = {
		store: PropTypes.object.isRequired,
	}

	render() {
		const store = this.props.store

		return (
			<BrowserRouter>
				<App store={store}>
					<Route exact path="/" render={props => <Scatter store={store} {...props} />} />
					<Route path="/gather" render={props => <Gather store={store} {...props} />} />
					<Route exact path="/settings" render={props => <Settings store={store} {...props} />} />
					<Route exact path="/log" render={props => <Log store={store} {...props} />} />
				</App>
			</BrowserRouter>
		)
	}
}

store.subscribe(state => render(<Layout store={state} />, document.getElementById('mnt')))

store.actions.start()
