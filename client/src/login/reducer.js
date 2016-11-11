import * as actionTypes from './actionTypes';

export default (state, action) => {
  switch (action.type) {
    case actionTypes.UPDATE_CREDENTIALS:
      return state.setIn(['formState', action.name], action.value);
    case actionTypes.LOGIN_ERROR:
      return state.setIn(['formState', 'hasErrors'], true);
    case actionTypes.LOGIN_SUCCESS:
      return state.setIn(['formState', 'hasErrors'], false);
    case actionTypes.GET_USER_SUCCESS:
      return state.set('user', action.payload);
    default:
      return state;
  }
}
