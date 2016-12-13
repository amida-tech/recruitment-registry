import * as t from './actionTypes';
import Immutable from 'immutable'

export const initialState = {
  user: {
    username: "",
    email: "",
    role: ""

  },
  survey: {
    questions: []
  }
};

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case t.UPDATE_PROFILE:
      return state.setIn(['userUpdated', action.name], action.value)
    case 'SAVE_PROFILE_SUCCESS':
      return state
        .set('userUpdated', undefined)
        .set('profileSaved', true)
    case t.GET_PROFILE_SUCCESS:
      // return Immutable.fromJS(action.payload)
          return state.merge({
            user : {
                'username': action.payload.username,
                'email': action.payload.email,
                'role': action.payload.role
            }
          });
    default:
      return state;
  }
}
