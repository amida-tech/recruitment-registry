import * as actionTypes from './actionTypes'
import Immutable from 'immutable'

const initialState = {
  selectedSurvey: [],
  surveyAnswers: {
    'surveyId': 0,
    'answers': []
  }
};

var immutableState = Immutable.fromJS(initialState);

export default (state = immutableState, action) => {
  switch (action.type) {
    case actionTypes.UPDATE_SURVEY_ANSWERS:
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
        var answers = state.getIn(['surveyAnswers', 'answers']).toJS();
        answers.forEach((answer, index) => { //Removes old answers.
            if(answer.questionId == newAnswer.questionId){
                answers.splice(index);
            }
          })
        answers.push(newAnswer);
        return state.setIn(['surveyAnswers', 'answers'], Immutable.fromJS(answers));
    case actionTypes.GET_SURVEY_BY_ID_SUCCESS:
      return state.merge({
        selectedSurvey: action.payload,
        surveyAnswers: {
          'surveyId': action.payload.id,
          'answers': []
        }
      })
    case actionTypes.SUBMIT_SURVEY_FAILURE:
      return state.set('hasErrors', true);
    case actionTypes.SUBMIT_SURVEY_SUCCESS:
      alert("You did it MacGuyver!");
      return state.set('hasErrors', false);
    default:
      return state;
  }
}
