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
    case 'GET_SURVEY':
      console.log("We should get survey " + JSON.stringify(action.pavload));
      return null;
    default:
      return state;
  }
}
