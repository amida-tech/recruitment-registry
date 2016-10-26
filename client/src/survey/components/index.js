import React, { Component} from 'react';
import { connect } from 'react-redux';
import submit from '../index'
import { SurveyInputField, SurveyBoolField, SurveyChoiceField, SurveyChoicesField } from './survey-form';

export class SurveyContainer extends Component {
  //Form submit seems to be such a good way to get what you need that I'm not
  //certain redux is the best call. However I'm doing it the redux way to learn.
  submitAnswers(event){
    event.preventDefault();
  }

  _changeAnswer(event) {
    this.props.dispatch(submit.actions.updateAnswer(event.target.dataset.index,
      event.target.id, event.target.value))
  }

  _changeChoices(event){
    console.log("YERP");
    console.log(event);
    //this.props.dispatch(submit.actions.updateChoices(event.target.dataset.index,))
  }

  render() {
    const { id, name, questions } = this.props.selectedSurvey.toJS()
    var questionnaire = [];
    if(questions){
      //Index tracks the question in its state, cause the id can differ
      questionnaire = questions.map((question, index) => {
        switch(question.type) {
          case "text":
            return (
              <SurveyInputField key={question.id} id={question.id}
                index={index} changeForm={::this._changeAnswer}
                text={question.text} required={question.required}/>
            );
            case "bool":
              return (
                <SurveyBoolField key={question.id} id={question.id}
                  index={index} changeForm={::this._changeAnswer}
                  text={question.text} vocab={this.props.vocab}
                  required={question.required}/>
              );
          case "choice":
            return (
              <SurveyChoiceField key={question.id} id={question.id}
                index={index} changeForm={::this._changeAnswer}
                text={question.text} vocab={this.props.vocab}
                choices={question.choices} required={question.required} />
            );
          case "choices":
            return (
              <SurveyChoicesField key={question.id} id={question.id}
                index={index} changeForm={::this._changeChoices}
                text={question.text} vocab={this.props.vocab}
                choices={question.choices} required={question.required}/>
            );
        }
      });
    }
    return (
      <div>
        <h1>{name}</h1>
        <form name="questionForm" onSubmit={(event) => this.submitAnswers(event)} key={id} className="">
          {questionnaire}
          <button>{this.props.vocab.get('SUBMIT')}</button>
        </form>
      </div>
    )}

  componentWillMount() {
    this.props.dispatch({type: 'GET_SURVEY_BY_ID', payload: this.props.params.id});
  }

}

const mapStateToProps = function(store) {
  return {
    selectedSurvey: store.getIn(['survey', 'selectedSurvey']),
    surveyAnswers: store.getIn(['survey', 'surveyAnswers']),
    vocab: store.getIn(['settings', 'language', 'vocabulary'])
  };
}

SurveyContainer.propTypes = {
  selectedSurvey: React.PropTypes.object.isRequired,
  surveyAnswers: React.PropTypes.object.isRequired
}

export default connect(mapStateToProps)(SurveyContainer);
