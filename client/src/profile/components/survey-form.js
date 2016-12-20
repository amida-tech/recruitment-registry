import React, { Component } from 'react'

class SurveyForm extends Component {
  render() {

    const survey = this.props.survey.toJS()

    return(
      <form className="m-x-1">

          <div>{ survey ? (survey.questions.map(question => {
            switch (question.type) {
              case 'choices':
                var choicesTmp = {};
                for (var i = 0; i < question.choices.length; i++) {
                  choicesTmp[question.choices[i].id] = question.choices[i].text;
                }
                if (question.answer) {
                  return [
                    <label className="rr">{question.text}</label>,
                    question.answer.choices.map(choice => {
                      return <p className="rr-hint m-l-1">{choicesTmp[choice]}</p>;
                    })
                  ]
                } else {
                  return [
                    <label>{question.text}</label>
                  ]
                }

              case 'bool':
                var ansTmp = question.answer && question.answer.boolValue ? this.props.vocab.get('YES') : this.props.vocab.get('NO');
                return [
                  <div><label className="rr">{question.text}</label><p className="rr-hint m-l-1">{ansTmp}</p></div>
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
