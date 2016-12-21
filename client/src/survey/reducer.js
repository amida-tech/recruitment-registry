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


// TODO: This function is too big.
export default (state = immutableState, action) => {
  switch (action.type) {
    case actionTypes.UPDATE_SURVEY_ANSWERS:
      var simpleAnswer = true;
      var newAnswer = {
        'questionId': parseInt(action.questionId),
        'answer': {}
      };
      switch(action.itype){
        case "text":
          newAnswer.answer = {'textValue': action.choice};
          break;
        case "choice":
          newAnswer.answer = {'choice': parseInt(action.choice)};
          break;
        case "bool":
          newAnswer.answer = {'boolValue': action.choice == true};
          break;
        case "choices.bool":
          simpleAnswer = false;
          newAnswer.answer = {
            'id': parseInt(action.choice),
            'boolValue': action.choicesValue == true};
          break;
        case "choices.text":
          simpleAnswer = false;
          newAnswer.answer = {
            'id': parseInt(action.choice),
            'textValue': action.choicesValue};
          break;
        }
        var answers = state.getIn(['surveyAnswers', 'answers']).toJS();
        var complexAnswer;
        answers.forEach((answer, index) => {
          if(answer.questionId == newAnswer.questionId){
              simpleAnswer ?
                answers.splice(index,1) :
                complexAnswer = index;
          }
        })
        if(simpleAnswer){
          answers.push(newAnswer);
        } else if (complexAnswer == undefined){
          newAnswer.answer = {'choices':[newAnswer.answer]};
          answers.push(newAnswer);
        } else {
          var complexChanged = false;
          answers[complexAnswer].answer.choices.forEach((answer, index) => {
            if(answer.id == parseInt(action.choice)){
                answers[complexAnswer].answer.choices[index] = newAnswer.answer;
                complexChanged = true;
            }
          })
          if(!complexChanged){
            answers[complexAnswer].answer.choices.push(newAnswer.answer);
          }
        }
        return state.setIn(['surveyAnswers', 'answers'], Immutable.fromJS(answers));
    case actionTypes.GET_SURVEY_BY_ID_SUCCESS:
      return state.merge({
        selectedSurvey: action.payload,
        surveyAnswers: {
          'surveyId': action.payload.id,
          'answers': []
        }
      });
    case actionTypes.SUBMIT_SURVEY_FAILURE:
      return state.set('hasErrors', true);
    case actionTypes.SUBMIT_SURVEY_SUCCESS:
      return state.set('hasErrors', false);
    default:
      return state;
  }
}
