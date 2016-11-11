import * as actionTypes from './actionTypes';

export function login(username, password) {
  return {
    type: actionTypes.LOGIN,
    payload: {
      username,
      password
    }
  }
}

export function logout() {
  return {
    type: actionTypes.LOGOUT
  }
}

export function update(name, value) {
  return {
    type: actionTypes.UPDATE_CREDENTIALS,
    name,
    value
  }
}
