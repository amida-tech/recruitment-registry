import React, { Component } from 'react'

class SurveyForm extends Component {
  render() {

    const survey = this.props.survey.toJS()

    return(
      <form>

          <div>{ survey ? (survey.questions.map(question => {
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
                if (question.answer && question.answer.boolValue) {
                  ansTmp = "yes"
                }
                return [
                  <div><label>{question.text}</label><p>{ansTmp}</p></div>
                ]
            }
          })) : (<div></div>) }</div>
      </form>
    )
  }
}

SurveyForm.propTypes = {
  survey: React.PropTypes.object
}

export default SurveyForm;