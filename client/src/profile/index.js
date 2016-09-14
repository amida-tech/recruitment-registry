import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

class ProfileContainer extends Component {
  render() {

    const { survey, user } = this.props.data;
    const {loggedIn} = this.props;
    return (
      <div>
        <h1>Profile</h1>
        <div>
          { loggedIn && survey ? (
            <div>
              <h2>{user.username}</h2>
              <div>

              </div>
              <h2>{survey.name}</h2>
              <div>
                { survey.questions.map(question => {
                  switch (question.type) {
                    case 'choices':
                      var choicesTmp = {};
                      for (var i = 0; i < question.choices.length; i++) {
                        choicesTmp[question.choices[i].id] = question.choices[i].text;
                      }
                      if (question.answer) {
                        return [
                          <label>{question.text}</label>,
                          question.answer.choices.map(choice => {
                            return <p>{choicesTmp[choice]}</p>;
                          })
                        ]
                      } else {
                        return [
                          <label>{question.text}</label>
                        ]
                      }

                    case 'bool':
                      var ansTmp = "no";
                      if (question.answer && question.answer.boolValue === "true") {
                          ansTmp = "yes"
                      }
                      return [
                        <div><label>{question.text}</label><p>{ansTmp}</p></div>
                      ]
                  }
                }) }
              </div>
            </div>
          ) : (<div><Link to="/login">Login</Link></div>)
          }
        </div>
      </div>
    );
  }

  componentWillMount() {
    this.props.dispatch({type: 'GET_PROFILE', surveyName: 'Alzheimer'})
  }
}

ProfileContainer.displayName = 'Profile';

function select(state) {
  return {
    data: state.profile,
    loggedIn: state.loggedIn
  };
}

export default connect(select)(ProfileContainer);