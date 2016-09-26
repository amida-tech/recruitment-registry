import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from './register-form';
import register from '../index';

export class RegisterContainer extends Component {
  render() {
    const { formState, survey, availableEthnicities, availableGenders } = this.props.data.toJS()
    return (
      <div className="container">
          <div className="form-page__form-header">
            <h2 className="form-page__form-heading">Register</h2>
          </div>
          <Form data={formState}
                location={location}
                availableEthnicities={availableEthnicities}
                availableGenders={availableGenders}
                history={this.props.history}
                onSubmit={::this._onSubmit}
                btnText={"Register"}
                survey={survey}
                changeForm={::this._changeForm}
                changeChoice={::this._changeChoice}/>
      </div>)
  }

  _changeForm(evt) {
    this.props.dispatch(register.actions.update(evt.target.id, evt.target.value))
  }

  _changeChoice(evt) {
    var dataTmp = evt.target.value.split('.')
    this.props.dispatch(register.actions.updateChoicesAnswer({
      surveyId: dataTmp[0],
      questionId: dataTmp[1],
      choiceId: dataTmp[2]
    }))
  }

  componentWillMount() {
    this.props.dispatch(register.actions.getSurvey('Alzheimer'))
  }

  _onSubmit(evt) {
    evt.preventDefault()

    var answersParsed = []


    var survey = this.props.data.get('survey').toJS()


    survey.questions.forEach((question) => {
      let ans;
      let choices = this.props.data.get('surveyResult').toJS().answers[question.id]
      if (question.type === 'choices') {

        if (choices) {
          choices = Object.keys(choices).filter((key) => {
            return choices[key]
          });
          choices = choices.map((id) => parseInt(id));
          ans = { choices: choices}
        } else {
          ans = { choices: [] }
        }

      } else if (question.type === 'bool') {
        var isChecked = !!choices && !!choices['-1']
        ans = { boolValue: isChecked }
        console.log(ans);
      }
      answersParsed.push({
        questionId: question.id,
        answer: ans
      })
    })

    this.props.dispatch({type: 'REGISTER', payload: {
      user: this.props.data.formState,
      registryName: 'Alzheimer',
      answers: answersParsed
    }})
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.get('register')
  }
}

export default connect(mapStateToProps)(RegisterContainer)