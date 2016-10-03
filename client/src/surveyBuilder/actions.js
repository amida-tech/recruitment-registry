import * as actionTypes from './actionTypes';

export function addQuestion(question) {
  return (dispatch) => {
    dispatch({
      type: actionTypes.ADD_QUESTION,
      payload: question
    })
  }
}

export function updateQuestion(question) {
  return (dispatch) => {
    dispatch({
      type: actionTypes.UPDATE_QUESTION,
      payload: question
    })
  }
}

export function saveSurvey(survey) {
  return (dispatch) => {
    dispatch({
      type: actionTypes.SAVE_SURVEY,
      payload: survey
    })
  }
}

export function updateSurveyName(name) {
  return (dispatch) => {
    dispatch({
      type: actionTypes.UPDATE_SURVEY_NAME,
      payload: name
    })
  }
}

export function getSurvey(id) {
  return (dispatch) => {
    dispatch({
      type: actionTypes.GET_SURVEY_BY_ID,
      payload: id
    })
  }
}