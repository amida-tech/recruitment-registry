import * as actionTypes from './actionTypes'
import Immutable from 'immutable'


const initialState = {
  survey: []
};

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case 'GET_SURVEY_BY_ID_SUCCESS':
      return state.set('survey', Immutable.fromJS(action.payload))
    default:
      return state;
  }
}
