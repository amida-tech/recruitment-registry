import React, { Component} from 'react';
import { connect } from 'react-redux';
import surveyBuilder from '../index';
import Toolbox from './toolbox'
import Guid from 'guid'

export class SurveyBuilderContainer extends Component {
  render() {
    const survey = this.props.data.get('survey').toJS()
    return (
      <div className="">
        <Toolbox questions={survey.questions}
                 addQuestion={::this._addQuestion}
                 updateQuestion={::this._updateQuestion}
                 changeChoice={::this._changeChoice}
                 updateSurveyName={::this.updateSurveyName} name={survey.name}/>
        <button type="submit" onClick={::this._saveSurvey}>Save</button>
        <p>{this.props.data.get('message')}</p>
      </div>
    )
  }

  componentWillMount() {
    if (this.props.params.id) {
      this.props.dispatch(surveyBuilder.actions.getSurvey(this.props.params.id))
    }
  }

  _changeChoice(item, evt) {
    var choices = item.question.choices.map((choice) => {
      if (choice.id === item.choiceId) {
        choice.text = evt.target.value
        return choice
      }
      return choice
    })

    item.question.choices = choices
    this.props.dispatch(surveyBuilder.actions.updateQuestion(item.question))
  }

  _addQuestion(question) {
    question.id = Guid.raw()
    this.props.dispatch(surveyBuilder.actions.addQuestion(question))
  }

  _updateQuestion(question) {
    this.props.dispatch(surveyBuilder.actions.updateQuestion(question))
  }

  _saveSurvey(evt) {
    this.props.dispatch(surveyBuilder.actions.saveSurvey(this.props.data.get('survey')))
  }

  updateSurveyName(name) {
    this.props.dispatch(surveyBuilder.actions.updateSurveyName(name))
  }

  // {this.props.params.id}
}

const mapStateToProps = function(store) {
  return {
    data: store.get('surveyBuilder')
  };
}

export default connect(mapStateToProps)(SurveyBuilderContainer);