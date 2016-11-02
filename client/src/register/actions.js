import * as actionTypes from './actionTypes';
import apiProvider from '../utils/api';

export function updateUser(id, value){
  return dispatch => dispatch({
    type: actionTypes.UPDATE_REGISTER_USER,
    id, value
  })
}

export function updateAnswer(itype, id, value, subvalue) {
  return dispatch => dispatch({
    type: actionTypes.UPDATE_REGISTER_ANSWERS,
    itype, id, value, subvalue
  })
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
