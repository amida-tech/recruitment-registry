import * as actionTypes from './actionTypes'
import Immutable from 'immutable'


const initialState = {
  surveys: []
};

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case 'GET_ALL_SURVEYS_SUCCESS':
      return Immutable.fromJS(action.payload)
    case 'GET_SURVEY_BY_ID_SUCCESS':
      console.log(JSON.stringify(action.payload));
      return action.payload;
    default:
      return state;
  }
}
