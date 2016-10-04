import * as t from './actionTypes';
import Immutable from 'immutable'
import { browserHistory } from 'react-router';

const initialState = {
  formState: {
    username: '',
    password: '',
    availableEthnicities: [
      "Caucasian",
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
    case 'CLEAR_CHOICES_ANSWER': {
      let answersClear = {};

      let qidClear = action.payload.questionId

      if (state.getIn(['surveyResult', 'answers'])) {
        answersClear = state.getIn(['surveyResult', 'answers']).toJS();
      }

      if (answersClear[qidClear]) {
        Object.keys(answersClear[qidClear]).forEach(function(cid) {
          answersClear[qidClear][cid] = false
        })
      }
      return state.merge({
        surveyResult: {
          surveyId: action.payload.surveyId,
          answers: answersClear
        }
      })
    }
    case 'UPDATE_CHOICES_ANSWER': {

      let answers = {};

      let qid = action.payload.questionId
      let cid = action.payload.choiceId

      if (state.getIn(['surveyResult', 'answers'])) {
        answers = state.getIn(['surveyResult', 'answers']).toJS();
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
    }
    case 'REGISTER_SUCCESS':

      return state;
    default:
      return state;
  }
}
