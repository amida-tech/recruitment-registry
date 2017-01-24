import React, { Component} from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import './index.scss';
import * as SurveyFields from '../../../common/SurveyFields';
import AdminAddQuestionModal from './question.js';

export class AdminSurveyContainer extends Component {
  //Form submit seems to be such a good way to get what you need that I'm not
  //certain redux is the best call. However I'm doing it the redux way to learn.
  newEdit() {
    this.startEditing({
      id: -1,
      type: "text",
      text: "Edit Your Question Text Here"
    })
  }

  startEditing(question) {
    this.props.dispatch(actions.startEditing(question));
  }

  makeQuestionsJSX(question, index) {
    switch(question.type) {
      case "text":
        return (
            <div key={question.id} className="container" onClick={() => this.startEditing(question)}>
              <label className="special questionNumber">Question {index+1}</label>
              <SurveyFields.Input
                  id={question.id}
                  text={question.text}
                  required={question.required}/>
            </div>
        );
      case "bool":
        return (
            <div key={question.id} className="container" onClick={() => this.startEditing(question)}>
              <label className="special questionNumber">Question {index+1}</label>
              <SurveyFields.Bool
                  id={question.id}
                  text={question.text}
                  vocab={this.props.vocab}
                  required={question.required}/>
            </div>
        );
      case "choice":
        return (
            <div key={question.id} className="container" onClick={() => this.startEditing(question)}>
              <label className="special questionNumber">Question {index+1}</label>
              <SurveyFields.Choice
                  id={question.id}
                  text={question.text}
                  vocab={this.props.vocab}
                  choices={question.choices} />
            </div>
        );
      case "choices":
        return (
            <div key={question.id} className="container" onClick={() => this.startEditing(question)}>
              <label className="special questionNumber">Question {index+1}</label>
              <SurveyFields.Choices
                  id={question.id}
                  text={question.text}
                  vocab={this.props.vocab}
                  choices={question.choices}
                  required={question.required}/>
            </div>
        );
    }
  }

  render() {

    // id is also available:
    const { id, name, questions } = this.props.selectedSurvey.toJS()
    // need to implement: lastUpdated
    let questionnaire = [];

    if(questions){
      questionnaire = questions.map(::this.makeQuestionsJSX);
    }

    return (
      <div>
        <AdminAddQuestionModal />
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
            <p><b className="gapRed">3 questions remaining</b></p>
            <p><button className="button buttonSecondary">Save Progress</button></p>
            <p><button onClick={() => this.newEdit()}>Add New Questionnaire</button></p>
          </div>
          <div id="survey" className="survey column is-two-thirds">
            <form name="questionForm" onSubmit={(event) => this.submitAnswers(event)} key={id} className="">
              {questionnaire}
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
    )
  }

  constructor(props) {
    super(props);
  }
  componentWillMount() {
    this.props.dispatch({type: 'GET_SURVEY_BY_ID', payload: this.props.params.id});
  }

}

const mapStateToProps = function(state, ownProps) {
  return {
    selectedSurvey: state.getIn(['adminSurvey', 'selectedSurvey']),
    vocab: state.getIn(['settings', 'language', 'vocabulary']),
    ...ownProps
  };
}

export default connect(mapStateToProps)(AdminSurveyContainer);
