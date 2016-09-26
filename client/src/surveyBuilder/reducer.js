import * as actionTypes from './actionTypes'
import Immutable from 'immutable'


const initialState = {
  survey: {
    name: '',
    questions: []
  }
};

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    /*case actionTypes.UPDATE_CREDENTIALS:
      return state.setIn(['formState', action.name], action.value)
    case actionTypes.LOGIN_ERROR:
      return state.setIn(['formState', 'hasErrors'], true)
    case actionTypes.LOGIN_SUCCESS:
      return state.setIn(['formState', 'hasErrors'], false)
    case actionTypes.GET_USER_SUCCESS:
      localStorage.user = JSON.stringify(action.payload)
      return state.update('user', action.payload);*/
    default:
      return state;
  }
}