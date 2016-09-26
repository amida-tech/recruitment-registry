import * as actionTypes from './actionTypes';

export function login(username, password) {
  return (dispatch) => {
    dispatch({
      type: actionTypes.LOGIN,
      payload: {
        username: username,
        password: password
      }
    })
  }
}

export function logout() {
  return (dispatch) => {
    dispatch({
      type: actionTypes.LOGOUT
    });
  }
}

export function update(name, value) {
  return dispatch => dispatch({
    type: actionTypes.UPDATE_CREDENTIALS,
    name, value
  });
}