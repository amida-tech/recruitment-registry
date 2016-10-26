import * as actionTypes from './actionTypes';

export function updateAnswer(index, id, value) {
  return dispatch => dispatch({
    type: actionTypes.UPDATE_SURVEY_ANSWERS,
    index, id, value
  })
}

export function updateChoices(index, id, value) {
  return dispatch => dispatch({
    type: actionTypes.UPDATE_SURVEY_CHOICES,
    index, id, value
  })
}
