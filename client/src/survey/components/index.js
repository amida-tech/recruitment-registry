import React, { Component} from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as SurveyFields from '../../common/SurveyFields';

export class SurveyContainer extends Component {
  //Form submit seems to be such a good way to get what you need that I'm not
  //certain redux is the best call. However I'm doing it the redux way to learn.
  submitAnswers(event){
    event.preventDefault();
      this.props.dispatch(actions.submitAnswers(this.props.surveyAnswers));
  }

  _changeAnswer(event) {
    this.props.dispatch(actions.updateAnswer(event.target.dataset.itype,
      event.target.name, event.target.value, null))
  }

  _changeAnswerChoices(itype, questionId, answerId, value) {
    this.props.dispatch(actions.updateAnswer(itype, questionId,
      answerId, value));
  }

  makeQuestionsJSX(question, index) {
  switch(question.type) {
    case "text":
      return (
          <div key={question.id} className="container">
            <label className="special questionNumber">Question {index+1}</label>
            <SurveyFields.Input
                id={question.id}
                changeForm={::this._changeAnswer}
                text={question.text}
                required={question.required}/>
          </div>
      );
    case "bool":
      return (
          <div key={question.id} className="container">
            <label className="special questionNumber">Question {index+1}</label>
            <SurveyFields.Bool
                id={question.id}
                changeForm={::this._changeAnswer}
                text={question.text}
                vocab={this.props.vocab}
                required={question.required}/>
          </div>
      );
    case "choice":
      return (
          <div key={question.id} className="container">
            <label className="special questionNumber">Question {index+1}</label>
            <SurveyFields.Choice
                id={question.id}
                changeForm={::this._changeAnswer}
                text={question.text}
                vocab={this.props.vocab}
                choices={question.choices} />
          </div>
      );
    case "choices":
      return (
          <div key={question.id} className="container">
            <label className="special questionNumber">Question {index+1}</label>
            <SurveyFields.Choices
                id={question.id}
                changeForm={::this._changeAnswer}
                text={question.text}
                vocab={this.props.vocab}
                choices={question.choices}
                changeFormChoices={::this._changeAnswerChoices}
                required={question.required}/>
          </div>
      );
  }
}

  render() {

    const { id, name, questions } = this.props.selectedSurvey.toJS()
    const surveyAnswers = this.props.surveyAnswers.get('answers');
    const surveyQuestions = this.props.selectedSurvey.get('questions');

    var questionnaire = [];


    if(questions){
      questionnaire = questions.map(::this.makeQuestionsJSX);
    }

    return (
      <div id="survey" className="container">
        <div className="survey row end-xs">
          <div className="col-xs-12 col-md-4 pull-right">
            <div className="survey-meta">
              <h3>Questionnaire</h3>
              <h1>{name}</h1>
              <span>{ surveyQuestions && (surveyQuestions.size - surveyAnswers.size) } Questions Remaining</span>
              { this.props.data.get('hasErrors') &&
              <div>
                  <p>{this.props.vocab.get('SUBMISSION_FAILURE')}</p>
              </div>
              }
            </div>
          </div>
          <div className="col-xs-12 col-md-7 text-left">
            <form name="questionForm" onSubmit={(event) => this.submitAnswers(event)} key={id} className="">
              <ol>
                {questionnaire}
              </ol>
              <button>{this.props.vocab.get('SUBMIT')}</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  componentWillMount() {
    this.props.dispatch({type: 'GET_SURVEY_BY_ID', payload: this.props.params.id});
  }

}

const mapStateToProps = function(state, ownProps) {
  return {
    data: state.get('survey'),
    selectedSurvey: state.getIn(['survey', 'selectedSurvey']),
    surveyAnswers: state.getIn(['survey', 'surveyAnswers']),
    vocab: state.getIn(['settings', 'language', 'vocabulary']),
    ...ownProps
  };
};

SurveyContainer.propTypes = {
  selectedSurvey: React.PropTypes.object.isRequired,
  surveyAnswers: React.PropTypes.object.isRequired
};

export default connect(mapStateToProps)(SurveyContainer);
