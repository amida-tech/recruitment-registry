import * as actionTypes from './actionTypes';

export function consentReducer(state, action) {

  const actionList = {
    [actionTypes.GET_CONSENT_DOCS_SUCCESS]: () => {
      return state.merge(state, {
        consentDocuments: action.payload
      });
    }
  }

  return {
    default: state,
    ...actionList
  }[action.type || 'default']

}
