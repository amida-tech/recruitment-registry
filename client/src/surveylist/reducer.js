import * as actionTypes from './actionTypes'


export default (state, action) => {
  switch (action.type) {
    case actionTypes.GET_ALL_SURVEYS_SUCCESS:
      return action.payload;
    default:
      return state;
  }
}
