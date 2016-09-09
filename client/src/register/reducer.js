import * as t from './actionTypes';

import { browserHistory } from 'react-router';
const assign = Object.assign || require('object.assign');

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

export default (state = initialState, action) => {
  switch (action.type) {
    case t.CHANGE_FORM:
      return assign({}, state, {
        formState: assign({}, state.formState, {
          [action.name]: action.value
        })
      });
    case 'GET_SURVEY_SUCCESS':
      return assign({}, state, {
        survey: action.payload
      });
    case 'UPDATE_CHOICES_ANSWER':

      var answers = {};

      if (state.surveyResult && state.surveyResult.answers) {
        answers = state.surveyResult.answers;
      }

      if (!answers[action.payload.questionId + ""]) {
        answers[action.payload.questionId + ""] = {};
      }

      if (!answers[action.payload.questionId + ""][action.payload.choiceId + ""]) {
        answers[action.payload.questionId + ""][action.payload.choiceId + ""] = true;
      } else {
        answers[action.payload.questionId + ""][action.payload.choiceId + ""] = false;
      }


      return assign({}, state, {
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