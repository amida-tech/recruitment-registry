import * as actionTypes from './actionTypes'
import Immutable from 'immutable'


const initialState = []

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case 'GET_ALL_SURVEYS_SUCCESS':
      console.log(action.payload)
      return Immutable.fromJS(action.payload)
    default:
      return state;
  }
}
