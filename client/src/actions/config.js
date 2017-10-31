const getConfig = ({ state, actions, opts: { api } }) => {
	actions.setBusy(true)

	api.getConfig().then(json => {
		actions.gotConfig(json)
		actions.setBusy(false)
	})
	// here i can catch the error and show an appropriate message

	return state
}

const gotConfig = ({ state }, config) => {
	return {
		...state,
		config,
	}
}

// function setNotifyCalc({ state, actions, opts: { api } }, notify) {
// 	if (state.config.notifyCalc !== notify) {
// 		api.setNotifyCalc(notify).then(json => actions.gotConfig(json))
// 	}

// 	return state
// }

// function setNotifyMove({ state, actions, opts: { api } }, notify) {
// 	if (state.config.notifyMove !== notify) {
// 		api.setNotifyMove(notify).then(json => actions.gotConfig(json))
// 	}

// 	return state
// }

// function setReservedSpace({ state, actions, opts: { api } }, stringAmount, unit) {
// 	// console.log('typeof: ', typeof amount)
// 	// if (typeof amount !== 'number') {
// 	// 	actions.addFeedback('Reserved space must be a number')
// 	// 	return state
// 	// }

// 	const amount = Number(stringAmount)
// 	// if (typeof amount !== 'number') {
// 	// 	actions.addFeedback('Reserved space must be a number')
// 	// 	return state
// 	// }

// 	switch (unit) {
// 		case '%':
// 			if (amount < 0 || amount > 100) {
// 				actions.addFeedback('Percentage value must be between 0 and 100')
// 				return state
// 			}
// 			break

// 		case 'Gb':
// 			if (amount < 0.45) {
// 				actions.addFeedback('Gb value must be higher than 0.45')
// 				return state
// 			}
// 			break

// 		case 'Mb':
// 		default:
// 			if (amount < 450) {
// 				actions.addFeedback('Mb value must be higher than 450')
// 				return state
// 			}
// 			break
// 	}

// 	if (state.config.reservedAmount !== amount || state.config.reservedUnit !== unit) {
// 		actions.setOpInProgress('Setting Reserved Space')

// 		api.setReservedSpace(amount, unit).then(json => actions.gotConfig(json))
// 	}

// 	return state
// }

// function toggleDryRun({ state, actions, opts: { api } }) {
// 	actions.setOpInProgress('Toggling dry run')

// 	api.toggleDryRun().then(json => actions.dryRunToggled(json))

// 	return state
// }

// function dryRunToggled({ state }, config) {
// 	return {
// 		...state,
// 		config,
// 		opInProgress: null,
// 	}
// }

// function setRsyncFlags({ state, actions, opts: { api } }, flags) {
// 	api.setRsyncFlags(flags).then(json => actions.gotConfig(json))

// 	return state
// }

// function setVerbosity({ state, actions, opts: { api } }, verbosity) {
// 	if (state.config.verbosity !== verbosity) {
// 		api.setVerbosity(verbosity).then(json => actions.gotConfig(json))
// 	}

// 	return state
// }

// function setUpdateCheck({ state, actions, opts: { api } }, checkForUpdate) {
// 	if (state.config.checkForUpdate !== checkForUpdate) {
// 		api.setUpdateCheck(checkForUpdate).then(json => actions.gotConfig(json))
// 	}

// 	return state
// }

export default {
	getConfig,
	gotConfig,

	// setNotifyCalc,
	// setNotifyMove,

	// setReservedSpace,

	// toggleDryRun,
	// dryRunToggled,

	// setRsyncFlags,

	// setVerbosity,
	// setUpdateCheck,
}
