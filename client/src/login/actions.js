import * as t from './actionTypes';

export function login(username, password) {
  return (dispatch) => {
    dispatch({
      type: t.LOGIN,
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
      type: t.LOGOUT
    });
  }
}

export function update(name, value) {
  return dispatch => dispatch({
    type: t.UPDATE_CREDENTIALS,
    name, value
  });
}