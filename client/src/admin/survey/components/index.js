import React, { Component} from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as SurveyFields from '../../../common/SurveyFields';

export class AdminSurveyContainer extends Component {
  //Form submit seems to be such a good way to get what you need that I'm not
  //certain redux is the best call. However I'm doing it the redux way to learn.
  submitAnswers(event){
    event.preventDefault();
      this.props.dispatch(actions.submitAnswers(this.props.surveyAnswers));
  }

  _changeAnswer(event) {
    this.props.dispatch(actions.updateAnswer(event.target.dataset.itype,
      event.target.id, event.target.value, event.target.name))
  }

  render() {
    console.log(this.props);
    const { id, name, questions } = this.props.selectedSurvey.toJS()
    var questionnaire = [];
    if(questions){
      questionnaire = questions.map(question => {
        switch(question.type) {
          case "text":
            return (
              <SurveyFields.Input key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                 required={question.required}/>
            );
          case "bool":
            return (
              <SurveyFields.Bool key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} required={question.required}/>
            );
          case "choice":
            return (
              <SurveyFields.Choice key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} choices={question.choices}
                required={question.required} />
            );
          case "choices":
            return (
              <SurveyFields.Choices key={question.id} id={question.id}
                changeForm={::this._changeAnswer} text={question.text}
                vocab={this.props.vocab} choices={question.choices}
                required={question.required}/>
            );
        }
      });
    }
    return (
      <div>
        <div className="columns">
          <div className="column is-one-thirds has-text-right">
            <h3 className="title is-3">Questionnaire</h3>
            <h2 className="title is-2">Section 1:</h2>
            <h1 className="title is-1">{name}</h1>
            <p><b>Last Updated: 3/15/16</b></p>
            <p><b className="gapRed">4 questions remaining</b></p>
            <button className="button buttonSecondary">Save Progress</button>
          </div>
          <div className="column is-two-thirds">
            <div className="">
              { this.props.data.get('hasErrors') ? (<p>{this.props.vocab.get('SUBMISSION_FAILURE')}</p>) : (<p></p>) }
            </div>
            <form name="questionForm" onSubmit={(event) => this.submitAnswers(event)} key={id} className="">
              {questionnaire}
              <button>{this.props.vocab.get('SUBMIT')}</button>
            </form>
          </div>
        </div>
      </div>
    )}

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
}

AdminSurveyContainer.propTypes = {
  selectedSurvey: React.PropTypes.object.isRequired,
  surveyAnswers: React.PropTypes.object.isRequired
}

export default connect(mapStateToProps)(AdminSurveyContainer);
