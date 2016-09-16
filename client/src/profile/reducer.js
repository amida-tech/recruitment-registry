import * as t from './actionTypes';

const assign = Object.assign || require('object.assign');

const initialState = {
  user: {},
  survey: {},
  userUpdated: undefined
};

export default (state = initialState, action) => {
  switch (action.type) {
    case t.UPDATE_PROFILE:
      return assign({}, state, {
        userUpdated: assign({}, state.userUpdated, {
          [action.name]: action.value
        })
      });
    case 'SAVE_PROFILE_SUCCESS':
      return assign({}, state, {
        userUpdated: undefined,
        profileSaved: true
      });
    case t.GET_PROFILE_SUCCESS:
      return action.payload
    default:
      return state;
  }
}