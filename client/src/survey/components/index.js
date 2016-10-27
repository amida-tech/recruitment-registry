import React, { Component} from 'react';
import { connect } from 'react-redux';
import submit from '../index'
import { SurveyInputField, SurveyBoolField, SurveyChoiceField, SurveyChoicesField } from './survey-form';

export class SurveyContainer extends Component {
  //Form submit seems to be such a good way to get what you need that I'm not
  //certain redux is the best call. However I'm doing it the redux way to learn.
  submitAnswers(event){
    event.preventDefault();
      this.props.dispatch(submit.actions.submitAnswers(this.props.surveyAnswers));
  }

  _changeAnswer(event) {
    this.props.dispatch(submit.actions.updateAnswer(event.target.dataset.itype,
      event.target.id, event.target.value, event.target.name))
  }

  render() {
    const { id, name, questions } = this.props.selectedSurvey.toJS()
    var questionnaire = [];
    if(questions){
      questionnaire = questions.map(question => {
        switch(question.type) {
          case "text":
            return (
              <SurveyInputField key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                 required={question.required}/>
            );
            case "bool":
            return (
              <SurveyBoolField key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} required={question.required}/>
            );
          case "choice":
            return (
              <SurveyChoiceField key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} choices={question.choices}
                required={question.required} />
            );
          case "choices":
            return (
              <SurveyChoicesField key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} choices={question.choices}
                required={question.required}/>
            );
        }
      });
    }
    return (
      <div>
        <h1>{name}</h1>
        <div className="">
          { this.props.data.get('hasErrors') ? (<p>{this.props.vocab.get('SUBMISSION_FAILURE')}</p>) : (<p></p>) }
        </div>
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
    data: store.get('survey'),
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
