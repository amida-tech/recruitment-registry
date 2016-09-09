import * as t from './actionTypes';

const assign = Object.assign || require('object.assign');

const initialState = {
  formState: {
    username: '',
    password: ''
  }
};

export default (state = initialState, action) => {
  switch (action.type) {
    case t.CHANGE_FORM:
      return assign({}, state, {
        formState: assign({}, state.formState, {
          [action.name]: action.value
        })
      });
    default:
      return state;
  }
}