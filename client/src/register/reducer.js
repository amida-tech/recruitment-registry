import * as t from './actionTypes';
import Immutable from 'immutable'
import { browserHistory } from 'react-router';

const initialState = {
  formState: {
    username: '',
    password: ''
  },
  survey: {
    questions: []
  },
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
        survey: action.payload,
        surveyResult: {
            surveyId: action.payload.id,
            answers: []
          }
      })
      case t.UPDATE_REGISTER_ANSWERS:
      var newAnswer = {
        'questionId': parseInt(action.id),
        'answer': {}
      }
      switch(action.itype){
        case "text":
          newAnswer.answer = {'textValue': action.value};
          break;
        case "choice":
          newAnswer.answer = {'choice': parseInt(action.value)};
          break;
        case "bool":
          newAnswer.answer = {'boolValue': action.value == 'true'}
          break;
        case "choices.bool":
          newAnswer.answer = {'choices': [{
            'id': parseInt(action.value),
            'boolValue': true}
          ]};
          break;
        case "choices.text": //I am interested in a less craptastic way.
          newAnswer.questionId =
            parseInt(action.name.substring(0, action.name.indexOf('.')));
          newAnswer.answer = {'choices': [{
            'id': parseInt(action.id),
            'boolValue': true,
            'textValue': action.value}
          ]};
          break;
        }
        var answers = state.getIn(['surveyResult', 'answers']).toJS();
        answers.forEach((answer, index) => { //Removes old answers.
            if(answer.questionId == newAnswer.questionId){
                answers.splice(index);
            }
          })
        answers.push(newAnswer);
        return state.setIn(['surveyResult', 'answers'], Immutable.fromJS(answers));
    case 'CLEAR_CHOICES_ANSWER': { //OLD
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
    case 'UPDATE_CHOICES_ANSWER': { //OLD

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
