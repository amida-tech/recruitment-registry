import * as actionTypes from './actionTypes';

export function updateProfile(name, value) {
  return dispatch => dispatch({
    type: actionTypes.UPDATE_PROFILE,
    name, value
  });
}

export function saveProfile() {
  return dispatch => dispatch({
    type: actionTypes.SAVE_PROFILE
  });
}

export function getProfile(surveyName) {
  return dispatch => dispatch({
    type: actionTypes.GET_PROFILE,
    surveyName: surveyName
  });
}

export function changeLanguage() {
  return dispatch => dispatch({
    type: actionTypes.CHANGE_LANGUAGE
  });
}
