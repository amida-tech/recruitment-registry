import * as actionTypes from './actionTypes';
import apiProvider from '../utils/api';

export function updateAnswer(itype, id, value, name) {
  return dispatch => dispatch({
    type: actionTypes.UPDATE_REGISTER_ANSWERS,
    itype, id, value, name
  })
}

export function update(name, value) {
  return dispatch => dispatch({
    type: actionTypes.CHANGE_FORM,
    name, value
  });
}

export function updateChoicesAnswer(data) {
  return dispatch => dispatch({
    type: "UPDATE_CHOICES_ANSWER",
    payload: data
  });
}

export function clearChoices(data) {
  return dispatch => dispatch({
    type: "CLEAR_CHOICES_ANSWER",
    payload: data
  });
}

export function getSurvey() {
  return dispatch => dispatch({
    type: actionTypes.GET_SURVEY
  });
}

export function register(data) {
  return () => {
    apiProvider.register(data);
  }
}
