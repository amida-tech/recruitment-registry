import React, { Component} from 'react';
import { Draggable, Droppable } from 'react-drag-and-drop'

export default class ChoiceQuestion extends Component {
  render() {

    const {question} = this.props

    return (
      <div key={question.id}>
        <label>Question text: <input onChange={this.props.changeQuestion.bind(this, question)} type="text" defaultValue={question.text}/></label>
        <div>
          {question.choices.map(choice => {
            if (choice.type === 'text') {
              return <label key={choice.id}>Choice text: <input onChange={this.props.changeChoice}
                                                                defaultValue={choice.text}
                                                                type="text"/></label>
            } else {
              return <label key={choice.id}>Choice bool: <input
                type="text"
                onChange={this.props.changeChoice.bind(this, {
                  question: question,
                  choiceId: choice.id
                })}
                defaultValue={choice.text}/></label>
            }
          })}
          <Droppable
            types={['choice']}
            onDrop={this.props.onDropChoice.bind(this, question)}>
            <ul className="add-choice"><p className="faded">Drop a choice here</p>

            </ul>
          </Droppable>
        </div>
      </div>
    )
  }
}
