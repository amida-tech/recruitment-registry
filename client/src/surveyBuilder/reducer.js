import * as actionTypes from './actionTypes'
import Immutable from 'immutable'

const initialState = {
  survey: {
    name: '',
    questions: [],
    released: true
  }
};

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case actionTypes.ADD_QUESTION:
      var questions = state.getIn(['survey', 'questions']).push(Immutable.fromJS(action.payload))
      return state.setIn(['survey', 'questions'], questions)
    case actionTypes.UPDATE_QUESTION:
      var questionsUpdate = state.getIn(['survey', 'questions']) //.push(Immutable.fromJS(action.payload))
      questionsUpdate = questionsUpdate.update(
        questionsUpdate.findIndex(function(question) {
          return question.get("id") === action.payload.id
        }), function() {
          return Immutable.fromJS(action.payload)
        }
      )
      return state.setIn(['survey', 'questions'], questionsUpdate)
    case actionTypes.SAVE_SURVEY_SUCCESS:
      return state.set('message', 'Successfully saved survey')
    case actionTypes.UPDATE_SURVEY_NAME:
      return state.setIn(['survey', 'name'], action.payload)
    case 'GET_SURVEY_BY_ID_SUCCESS':
      return state.set('survey', Immutable.fromJS(action.payload))
    default:
      return state;
  }
}