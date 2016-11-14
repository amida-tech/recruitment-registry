import * as actionTypes from './actionTypes';

export function updateAnswer(itype, questionId, choice, choicesValue) {
  return dispatch => dispatch({
    type: actionTypes.UPDATE_SURVEY_ANSWERS,
    itype,
    questionId,
    choice,
    choicesValue
  })
}

export function submitAnswers(surveyAnswers){
  return dispatch => dispatch({
    type: actionTypes.SUBMIT_SURVEY,
    payload: surveyAnswers
  });
}
