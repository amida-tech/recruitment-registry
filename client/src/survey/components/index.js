import React, { Component} from 'react';
import { connect } from 'react-redux';
import { SurveyInputField, SurveyBoolField, SurveyChoiceField, SurveyChoicesField } from './survey-form';

export class SurveyContainer extends Component {
  constructor(props){
    super(props);
    this.state={};
    this.handleSubmit= this.handleSubmit.bind(this);
  }

  handleSubmit(event){
    var questions = this.props.selectedSurvey.toJS().questions;
    console.log(questions);
    var results = {
      "surveyId": this.props.selectedSurvey.toJS().id,
      "answers": []
    };
    questions.forEach(question => {
      switch(question.type) {
        case "text":
          results.answers.push({
            "questionId":question.id,
            "answer": {
              "textValue": document.getElementById(question.id).value
            }});
            break;
        case "bool":
          results.answers.push({
            "questionId":question.id,
            "answer": {
              "boolValue": document.getElementById(question.id+'t').checked
            }});
            break;
        case "choice":
          results.answers.push({
            "questionId":question.id,
            "answer": {
              "choice": document.getElementById(question.id).value
            }});
            break;
        case "choices":
          var choices = [];
          question.choices.forEach(choice => {
            if(choice.text == document.getElementById(question.id).value){
              if(choice.type == "text"){
                choices.push({
                  "id":choice.id,
                  "boolValue": true,
                  "textValue": document.getElementById(question.id+'text').value
                })} else {
                  choices.push({
                    "id":choice.id,
                    "boolValue": true
                  })
              }} else {
                  choices.push({
                    "id":choice.id,
                    "boolValue": false
                  })}
          });
          results.answers.push({
            "questionId":question.id,
            "answer": choices
          });
          break;
      }});
    console.log(results.answers);
  }

  render() {
    const { id, name, questions } = this.props.selectedSurvey.toJS()
    var questionnaire = [];
    if(questions){
      questionnaire = questions.map((question) => {
        switch(question.type) {
          case "text":
            return (
              <SurveyInputField key={question.id}
                id={question.id} text={question.text}
                required={question.required}/>
            );
            case "bool":
              return (
                <SurveyBoolField key={question.id}
                  id={question.id} text={question.text}
                  vocab={this.props.vocab} required={question.required}/>
              );
          case "choice":
            return (
              <SurveyChoiceField key={question.id}
                id={question.id} text={question.text}
                choices={question.choices} required={question.required}/>
            );
          case "choices":
            return (
              <SurveyChoicesField key={question.id}
                id={question.id} text={question.text} vocab={this.props.vocab}
                choices={question.choices} required={question.required}/>
            );
        }
      });
    }
    return (
      <div>
        <h1>{name}</h1>
        <div key={id} className="">
          {questionnaire}
          <button onClick={this.handleSubmit}>{this.props.vocab.get('SUBMIT')}</button>
        </div>
      </div>
    )}

  componentWillMount() {
    this.props.dispatch({type: 'GET_SURVEY_BY_ID', payload: this.props.params.id});
  }

}

const mapStateToProps = function(store) {
  return {
    selectedSurvey: store.getIn(['survey', 'selectedSurvey']),
    vocab: store.getIn(['settings', 'language', 'vocabulary'])
  };
}

SurveyContainer.propTypes = {
  selectedSurvey: React.PropTypes.object.isRequired
}

export default connect(mapStateToProps)(SurveyContainer);
