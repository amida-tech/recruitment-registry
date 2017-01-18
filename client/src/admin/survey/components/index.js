import React, { Component} from 'react';
import { connect } from 'react-redux';
import * as actions from '../../../survey/actions';
import './index.scss';
import * as SurveyFields from '../../../common/SurveyFields';
import AdminAddQuestionModal from './question.js';

export class AdminSurveyContainer extends Component {
  //Form submit seems to be such a good way to get what you need that I'm not
  //certain redux is the best call. However I'm doing it the redux way to learn.
  showModal(){
    this.setState({modalStatus: true});
  }

  changeModal(val) {
    this.setState({modalStatus: val});
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
    // id is also available:
    const { id, name, questions } = this.props.selectedSurvey.toJS()
    const surveyAnswers = this.props.surveyAnswers.get('answers');
    const surveyQuestions = this.props.selectedSurvey.get('questions');
    // need to implement: lastUpdated

    var questionnaire = [];

    if(questions){
      questionnaire = questions.map(::this.makeQuestionsJSX);
    }

    return (
      <div>
        <AdminAddQuestionModal modalStatus={this.state.modalStatus} handleChange={this.changeModal.bind(this)}/>
        <div className="columns">
          <div className="column is-one-thirds has-text-right">
            <h3 className="title is-3">Questionnaire</h3>
          </div>
          <div className="column is-two-thirds">
          </div>
        </div>
        <div className="columns">
          <div className="column is-one-thirds has-text-right">
            <h2 className="title is-2">Section 1:</h2>
            <h1 className="title is-1">{name}</h1>
            <p><b>Last Updated: 3/15/16</b></p>
            <p><b className="gapRed">{ surveyQuestions && (surveyQuestions.size - surveyAnswers.size) } questions remaining</b></p>
            <p><button className="button buttonSecondary">Save Progress</button></p>
            <p><button onClick={() => this.showModal()} >Add New Questionnaire</button></p>
            { this.props.data.get('hasErrors') &&
            <div>
                <p>{this.props.vocab.get('SUBMISSION_FAILURE')}</p>
            </div>
            }
          </div>
          <div id="survey" className="survey column is-two-thirds">
            <form name="questionForm" onSubmit={(event) => this.submitAnswers(event)} key={id} className="">
              {questionnaire}
                  <ol>
                  {questionnaire}
                  </ol>
              <button className="submit">{this.props.vocab.get('SUBMIT')}</button>
            </form>
            <div className="control is-grouped">
              <p className="control">
                <button className="button buttonSecondary">Save Progress</button>
              </p>
              <p className="control">
                <button>Add New Questionnaire</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

  constructor(props) {
    super(props);
    this.state  = {
      modalStatus: false
    }
  }
  componentWillMount() {
    this.props.dispatch({type: 'GET_SURVEY_BY_ID', payload: this.props.params.id});
  }

}

const mapStateToProps = function(state, ownProps) {
  return {
    data: state.get('survey'),
    selectedSurvey: state.getIn(['adminSurvey', 'selectedSurvey']),
    surveyAnswers: state.getIn(['adminSurvey', 'surveyAnswers']),
    vocab: state.getIn(['settings', 'language', 'vocabulary']),
    ...ownProps
  };
}

AdminSurveyContainer.propTypes = {
  selectedSurvey: React.PropTypes.object.isRequired,
  surveyAnswers: React.PropTypes.object.isRequired
}

export default connect(mapStateToProps)(AdminSurveyContainer);
