import React, { Component} from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import './index.scss';
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
              <div className="box">
                <article className="media">
                  <div className="media-content">
                    <div className="content">
                      <h4 className="title is-6 is-marginless gapMediumGray">Question {question.id}</h4>
                      <SurveyFields.Input key={question.id} id={question.id}
                        changeForm={::this._changeAnswer} text={question.text}
                         required={question.required}/>
                    </div>
                  </div>
                </article>
              </div>
            );
          case "bool":
            return (
              <div className="box">
                <article className="media">
                  <div className="media-content">
                    <div className="content">
                      <h4 className="title is-6 is-marginless gapMediumGray">Question {question.id}</h4>
                      <SurveyFields.Bool key={question.id} id={question.id}
                        changeForm={::this._changeAnswer} text={question.text}
                        vocab={this.props.vocab} required={question.required}/>
                    </div>
                  </div>
                </article>
              </div>
            );
          case "choice":
            return (
              <div className="box">
                <article className="media">
                  <div className="media-content">
                    <div className="content">
                      <h4 className="title is-6 is-marginless gapMediumGray">Question {question.id}</h4>
                      <SurveyFields.Choice key={question.id} id={question.id}
                        changeForm={::this._changeAnswer} text={question.text}
                        vocab={this.props.vocab} choices={question.choices}
                        required={question.required} />
                    </div>
                  </div>
                </article>
              </div>
            );
          case "choices":
            return (
              <div className="box">
                <article className="media">
                  <div className="media-content">
                    <div className="content">
                      <h4 className="title is-6 is-marginless gapMediumGray">Question {question.id}</h4>
                      <SurveyFields.Choices key={question.id} id={question.id}
                        changeForm={::this._changeAnswer} text={question.text}
                        vocab={this.props.vocab} choices={question.choices}
                        required={question.required}/>
                    </div>
                  </div>
                </article>
              </div>
            );
        }
      });
    }
    return (
      <div>
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
            <p><b className="gapRed">4 questions remaining</b></p>
            <p><button className="button buttonSecondary">Save Progress</button></p>
            <p><button>Add New Questionnaire</button></p>
          </div>
          <div className="column is-two-thirds">
            {questionnaire}
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
