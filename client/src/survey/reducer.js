import * as actionTypes from './actionTypes'
import Immutable from 'immutable'


const initialState = {
  selectedSurvey: []
};

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case 'GET_SURVEY_BY_ID_SUCCESS':
      return state.merge({
        selectedSurvey: action.payload
      }) //return state.set('selectedSurvey', Immutable.fromJS(action.payload))
    default:
      return state;
  }
}
