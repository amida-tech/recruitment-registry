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
    case 'GET_SURVEY_BY_ID_SUCCESS':
      var allAnswers = {
        'surveyId': action.payload.id,
        'answers': []
      };
      action.payload.questions.forEach(question => {
        switch(question.type) {
          case 'text':
            allAnswers.answers.push({
              'questionId': question.id,
              'answer': {
                'textValue': ''
              }
            });
            break;
          case 'bool':
            allAnswers.answers.push({
              'questionId': question.id,
              'answer': {
                'boolValue': false
              }
            });
            break;
          case 'choice':
            allAnswers.answers.push({
              'questionId': question.id,
              'answer': {
                'choice': 0
              }
            });
            break;
          case 'choices':
            var choicesTemplate = [];
            question.choices.forEach(choice =>{
              choicesTemplate.push({
                'id': choice.id,
                'boolValue': false,
                'textValue': ''
              })
            })
            allAnswers.answers.push({
              'questionId': question.id,
              'answer': {
                'choices': choicesTemplate
              }
            });
            break;
        }
      })
      return state.merge({
        selectedSurvey: action.payload,
        surveyAnswers: allAnswers
      }) //return state.set('selectedSurvey', Immutable.fromJS(action.payload))
    default:
      return state;
  }
}
