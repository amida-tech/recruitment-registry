import React, { Component } from 'react';

class Form extends Component {
  render() {

    const { user, survey } = this.props

    const renderSelectField = (id, defaultValue, label, options) => (
      <div className="form-group">
        <label htmlFor="gender">{label}</label>
        <select required onChange={this.props.changeProfile} defaultValue={defaultValue} className="form-control" id={id}>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    );

    return(
      <form onSubmit={this.props.onSubmit}>
        <h2>{user.username}</h2>
        <div>

          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input className="form-control" id="password" type="password" onChange={this.props.changeProfile} />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="text" id="email" defaultValue={user.email} onChange={this.props.changeProfile}/>
          </div>

          <div className="form-group">
            <label>ZIP</label>
            <input className="form-control" type="text" id="zip" defaultValue={user.zip} onChange={this.props.changeProfile}/>
          </div>
          {renderSelectField("gender", user.gender, "Gender", this.props.availableGenders)}
          {renderSelectField("ethnicity", user.ethnicity, "Ethnicity", this.props.availableEthnicities)}
          <p>{this.props.profileSaved ? "Profile Saved" : ""}</p>
          <button disabled={!this.props.hasChanges} className="form__submit-btn" type="submit">Save profile</button>
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
                if (question.answer && question.answer.boolValue) {
                  ansTmp = "yes"
                }
                return [
                  <div><label>{question.text}</label><p>{ansTmp}</p></div>
                ]
            }
          }) }
        </div>
      </form>
    )
  }
}

Form.propTypes = {
  user: React.PropTypes.object.isRequired,
  survey: React.PropTypes.object.isRequired,
  changeProfile: React.PropTypes.func.isRequired,
  hasChanges: React.PropTypes.bool,
  profileSaved: React.PropTypes.bool
}

export default Form;