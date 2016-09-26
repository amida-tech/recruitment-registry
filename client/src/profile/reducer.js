import * as t from './actionTypes';

const initialState = {
  user: {},
  survey: {},
  userUpdated: undefined
};

export default (state = initialState, action) => {
  switch (action.type) {
    case t.UPDATE_PROFILE:
      return state.setIn(['userUpdated', action.name], action.value)
    case 'SAVE_PROFILE_SUCCESS':
      return state
        .set('userUpdated', undefined)
        .set('profileSaved', true)
    case t.GET_PROFILE_SUCCESS:
      return action.payload
    default:
      return state;
  }
}
