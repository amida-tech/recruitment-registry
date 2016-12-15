import React, { Component} from 'react';

export default class TextQuestion extends Component {
  render() {

    const {question} = this.props

    return (
      <div key={question.id}>
        <label>Question text: <input onChange={this.props.changeQuestion.bind(this, question)} type="text" defaultValue={question.text}/></label>
      </div>
    )
  }
}