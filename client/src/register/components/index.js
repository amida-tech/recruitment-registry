import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from './register-form';
import register from '../index';

export class RegisterContainer extends Component {
  render() {
    const dispatch = this.props.dispatch;
    const { formState, survey, availableEthnicities, availableGenders } = this.props.data;
    const { loggedIn } = this.props;
    return (
      <div> { !loggedIn ? (
        <div className="container">
            <div className="form-page__form-header">
              <h2 className="form-page__form-heading">Register</h2>
            </div>
            <Form data={formState}
                  dispatch={dispatch}
                  location={location}
                  availableEthnicities={availableEthnicities}
                  availableGenders={availableGenders}
                  history={this.props.history}
                  onSubmit={::this._onSubmit}
                  btnText={"Register"}
                  survey={survey}
                  changeForm={::this._changeForm}
                  changeChoice={::this._changeChoice}/>
        </div>) : ( <h3>You are already logged in :)</h3>) }
      </div>)
  }

  _changeForm(evt) {
    this.props.dispatch(register.actions.update(evt.target.id, evt.target.value));
  }

  _changeChoice(evt) {
    var dataTmp = evt.target.value.split('.');
    this.props.dispatch(register.actions.updateChoicesAnswer({
      surveyId: dataTmp[0],
      questionId: dataTmp[1],
      choiceId: dataTmp[2]
    }));
  }

  componentWillMount() {
    this.props.dispatch({type: 'GET_SURVEY', surveyName: 'Alzheimer'})
  }

  _onSubmit(evt) {
    evt.preventDefault();

    var answersParsed = [];


    var survey = this.props.data.survey;


    survey.questions.forEach((question) => {
      let ans;
      if (question.type === 'choices') {
        let choices = this.props.data.surveyResult.answers[question.id];

        if (choices) {
          choices = Object.keys(choices).filter((key) => {
            return choices[key];
          });
          choices = choices.map((id) => parseInt(id));
          ans = { choices: choices}
        } else {
          ans = {choices: []}
        }

      } else if (question.type === 'bool') {
        ans = { boolValue: this.props.data.surveyResult.answers[question.id] && !!this.props.data.surveyResult.answers[question.id]['-1'] }
      }
      answersParsed.push({
        questionId: question.id,
        answer: ans
      });
    });

    this.props.dispatch({type: 'REGISTER', payload: {
      user: this.props.data.formState,
      surveyId: 1,
      answers: answersParsed
    }});
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.register,
    loggedIn: store.loggedIn
  };
}

export default connect(mapStateToProps)(RegisterContainer);