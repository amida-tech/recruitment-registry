import * as actionTypes from './actionTypes';

export function getSurvey(id) {
  return (dispatch) => {
    dispatch({
      type: actionTypes.GET_SURVEY_BY_ID,
      payload: id
    })
  }
}
