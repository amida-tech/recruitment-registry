import * as t from './actionTypes';
import Immutable from 'immutable'
import { browserHistory } from 'react-router';

const initialState = {
  newUserProfile: {
    user: {
      username: '',
      password: '',
      role: 'participant',
      email: ''
    },
    answers: []
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
    case 'GET_SURVEY_SUCCESS':
      return state.merge({
        survey: action.payload,
        newUserProfile: {
          user: {
            username: '',
            password: '',
            role: 'participant',
            email: ''
          },
          answers: []
        }
      })
      case t.UPDATE_REGISTER_USER:
        return state.setIn(['newUserProfile', 'user', action.id], Immutable.fromJS(action.value));
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
        var answers = state.getIn(['newUserProfile', 'answers']).toJS();
        answers.forEach((answer, index) => { //Removes old answers.
            if(answer.questionId == newAnswer.questionId){
                answers.splice(index);
            }
          })
        answers.push(newAnswer);
        return state.setIn(['newUserProfile', 'answers'], Immutable.fromJS(answers));
    case 'REGISTER_SUCCESS':
      return state;
    default:
      return state;
  }
}
