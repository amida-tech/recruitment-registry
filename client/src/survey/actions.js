import * as actionTypes from './actionTypes';

export function updateAnswer(itype, id, value, name) {
  return dispatch => dispatch({
    type: actionTypes.UPDATE_SURVEY_ANSWERS,
    itype, id, value, name
  })
}

export function submitAnswers(surveyAnswers){
  return dispatch => dispatch({
    type: actionTypes.SUBMIT_SURVEY,
    payload: surveyAnswers
  })
}
