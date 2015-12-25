import B from 'baconjs'

import Dispatcher from './lib/dispatcher'
import * as C from './constant'

import Api from './lib/api'
import WebSocketApi from './lib/wsapi'

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
// 		inProgress: false, // need to review this variable
// 	}
// 	opInProgress: null,
//  consoleLines: [],
//	progressText: "",
// }

export default class Store {
	constructor(initialState = {}) {
		const api = new Api()
		const ws = new WebSocketApi()

		this.state = this._setup(initialState, api, ws, Dispatcher.dispatch, Dispatcher.register)
	}

	get status() {
		return this.state
	}

	_setup(initialState, api, ws, dispatch, register) {
		const [
			start, 
			getConfig,
			gotConfig,
			addFolder,
			folderAdded,
			opInProgress,
			getStorage,
			gotStorage,
			calculate,
			calcStarted,
			calcProgress,
			calcFinished,
			move,
			toggleDryRun,
			gotWsMessage,
		] = register(
			C.START,
			C.GET_CONFIG,
			C.GOT_CONFIG,
			C.ADD_FOLDER,
			C.FOLDER_ADDED,
			C.OP_IN_PROGRESS,
			C.GET_STORAGE,
			C.GOT_STORAGE,
			C.CALCULATE,
			C.CALC_STARTED,
			C.CALC_PROGRESS,
			C.CALC_FINISHED,
			C.MOVE,
			C.TOGGLE_DRY_RUN,
			C.GOT_WS_MESSAGE,
		)

		// const ws = new WebSocket(WS_URL)

		ws.stream.onValue(event => {
			console.log('streaming: ', event)
			dispatch(event.topic, event.payload)
		})

		return B.update(
			initialState,
			getConfig, _getConfig,
			gotConfig, _gotConfig,
			addFolder, _addFolder,
			folderAdded, _folderAdded,
			opInProgress, _opInProgress,
			getStorage, _getStorage,
			gotStorage, _gotStorage,
			calculate, _calculate,
			calcStarted, _calcStarted,
			calcProgress, _calcProgress,
			calcFinished, _calcFinished,
			gotWsMessage, _gotWsMessage,
		)

		function _getConfig(state, _) {
			dispatch(C.OP_IN_PROGRESS, C.GET_CONFIG)

			B.fromPromise(api.getConfig()).onValue(json => {
				dispatch(C.GOT_CONFIG, json)
			})

			return state
		}

		function _gotConfig(state, config) {
			return {
				...state,
				config: config,
				opInProgress: null,
			}
		}

		function _addFolder(state, folder) {
			dispatch(C.OP_IN_PROGRESS, C.ADD_FOLDER)

			B.fromPromise(api.addFolder(folder)).onValue(json => {
				dispatch(C.FOLDER_ADDED, json)
			})

			return state
		}

		function _folderAdded(state, config) {
			return {
				...state,
				config: config,
				opInProgress: null,
			}
		}

		function _opInProgress(state, action) {
			return {
				...state,
				opInProgress: action
			}
		}

		function _getStorage(state, _) {
			dispatch(C.OP_IN_PROGRESS, C.GET_STORAGE)

			B.fromPromise(api.getStorage()).onValue(json => {
				dispatch(C.GOT_STORAGE, json)
			})

			return state
		}

		function _gotStorage(state, unraid) {
			console.log('unraid: ', unraid)
			
			return {
				...state,
				opInProgress: null,
				unraid,
			}
		}

		function _calculate(state, payload) {
			dispatch(C.OP_IN_PROGRESS, C.CALCULATE)

			ws.send({topic: C.CALCULATE, payload})
			return state
		}

		function _calcStarted(state, payload) {
			return {
				...state,
				progressText: 'CALCULATE: ' + payload,
			}
		}

		function _calcProgress(state, payload) {
			return {
				...state,
				progressText: 'CALCULATE: ' + payload,
			}
		}

		function _calcFinished(state, payload) {
			return {
				...state,
				progressText: "",
				opInProgress: null,
			}
		}

		function _gotWsMessage(state, message) {
			return {
				...state,
				consoleLines: consoleLines.push(message)
			}
		}		
	}
}


// export default function createStore(initialState = {}, dispatcher) {
// 	let state = { ...initialState, dispatch: dispatcher.dispatch }

// 	return B.combineTemplate


// }