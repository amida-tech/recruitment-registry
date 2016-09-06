import * as t from './actionTypes';

const assign = Object.assign || require('object.assign');

const initialState = {
  formState: {
    username: '',
    password: ''
  },
  currentlySending: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case t.CHANGE_FORM:
      return assign({}, state, {
        formState: action.newState
      });
    case t.SENDING_REQUEST:
      return assign({}, state, {
        currentlySending: action.sending
      });
    default:
      return state;
  }
}