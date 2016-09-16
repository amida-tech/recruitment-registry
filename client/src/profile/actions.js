import * as t from './actionTypes';

export function updateProfile(name, value) {
  return dispatch => dispatch({
    type: t.UPDATE_PROFILE,
    name, value
  });
}

export function saveProfile() {
  return dispatch => dispatch({
    type: t.SAVE_PROFILE
  });
}