import * as t from './actionTypes';
import Immutable from 'immutable'
import { browserHistory } from 'react-router';

const initialState = {
  formState: {
    username: '',
    password: '',
    availableEthnicities: [
      "Caucasion",
      "Hispanic",
      "African",
      "Asian"
    ],
    availableGenders: [
      "male",
      "female",
      "other"
    ]
  },
  survey: {
    questions: []
  }
};

const immutableState = Immutable.fromJS(initialState)

export default (state = immutableState, action) => {
  switch (action.type) {
    case t.CHANGE_FORM:
      return state.merge({
        formState: state.get('formState').merge({
          [action.name]: action.value
        })
      })
    case 'GET_SURVEY_SUCCESS':
      return state.merge({
        survey: action.payload
      })
    case 'UPDATE_CHOICES_ANSWER':

      var answers = {};

      var qid = action.payload.questionId
      var cid = action.payload.choiceId

      if (state.surveyResult && state.surveyResult.answers) {
        answers = state.surveyResult.answers;
      }

      answers[qid] = answers[qid] ? answers[qid] : {}

      if (!answers[qid][cid]) {
        answers[qid][cid] = true;
      } else {
        answers[qid][cid] = false
      }

      return state.merge({
        surveyResult: {
          surveyId: action.payload.surveyId,
          answers: answers
        }
      });
    case 'REGISTER_SUCCESS':
      browserHistory.push('/login');
      return state;
    default:
      return state;
  }
}