import * as actionTypes from './actionTypes'
import Immutable from 'immutable'

const initialState = {
  selectedSurvey: {
    id: -1,
    name: '',
    questions: []
  },
  editingData: {
    isEditing: false,
    curQuestion: {},
    isDeleting: false
  }
};

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case actionTypes.UPDATE_DELETE:
      return state.setIn(['editingData', 'isDeleting'], action.payload);
    case actionTypes.SAVE_EDITING:
      return state.setIn(['editingData', 'isEditing'], false);
    case actionTypes.UPDATE_QUESTION:
      return state.setIn(['editingData', 'curQuestion'], action.payload);
    case actionTypes.START_EDITING:
      var nextState = state.setIn(['editingData', 'curQuestion'], action.payload);
      return nextState.setIn(['editingData', 'isEditing'], true);
    case actionTypes.ADD_QUESTION:
      var questions = state.getIn(['survey', 'questions']).push(Immutable.fromJS(action.payload))
      return state.setIn(['survey', 'questions'], questions)
    case actionTypes.SAVE_SURVEY_SUCCESS:
      return state.set('message', 'Successfully saved survey')
    case actionTypes.UPDATE_SURVEY_NAME:
      return state.setIn(['survey', 'name'], action.payload)
    case actionTypes.GET_SURVEY_BY_ID_SUCCESS:
      return state.merge({
        selectedSurvey: action.payload
      });
    default:
      return state;
  }
}