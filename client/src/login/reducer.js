import * as actionTypes from './actionTypes'
import Immutable from 'immutable'

export const initialState = {
  formState: {
    username: '',
    password: '',
  },
  user: localStorage.user ? JSON.parse(localStorage.user) : {
    username: "",
    role: "",
    id: ""
  }
}

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case actionTypes.UPDATE_CREDENTIALS:
      return state.setIn(['formState', action.name], action.value)
    case actionTypes.LOGIN_ERROR:
      return state.setIn(['formState', 'hasErrors'], true)
    case actionTypes.LOGIN_SUCCESS:
      return state.setIn(['formState', 'hasErrors'], false)
    case actionTypes.GET_USER_SUCCESS:
      localStorage.user = JSON.stringify(action.payload)
      return state.set('user', Immutable.fromJS(action.payload));
    default:
      return state;
  }
}