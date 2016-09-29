import React, { Component} from 'react';
import { Draggable, Droppable } from 'react-drag-and-drop'
import './index.scss';

export default class Toolbox extends Component {
  render() {
    return (
      <div>
        <ul>
          <Draggable type="question" data="checkboxes"><li>Checkbox(es)</li></Draggable>
          <Draggable type="question" data="text"><li>Text</li></Draggable>
          <Draggable type="question" data="dropdown"><li>Dropdown</li></Draggable>
        </ul>
        <Droppable
            types={['question']}
            onDrop={this.onDrop.bind(this)}>
          <ul className="question"></ul>
        </Droppable>

        <Droppable
          types={['newQuestion']}
          onDrop={this.onDropNew.bind(this)}>
          <ul className="newQuestion"></ul>
        </Droppable>
      </div>
    );
  }

  onDropNew(data) {
    this.props.onDropQuestion(data);
  }

  onDrop(data) {
    this.props.onDropQuestion(data);
  }
}