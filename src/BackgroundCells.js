import React from 'react';
import { findDOMNode } from 'react-dom';
import cn from 'classnames';

import dates from './utils/dates';
import { segStyle } from './utils/eventLevels';
import { notify } from './utils/helpers';
import { elementType } from './utils/propTypes';
import { dateCellSelection, slotWidth, getCellAtX, pointInBox } from './utils/selection';
import Selection, { getBoundsForNode, isEvent } from './Selection';

class BackgroundCells extends React.Component {

  static propTypes = {
    cellWrapperComponent: elementType,
    container: React.PropTypes.func,
    selectable: React.PropTypes.oneOf([true, false, 'ignoreEvents']),

    onSelectSlot: React.PropTypes.func.isRequired,
    onSelectEnd: React.PropTypes.func,
    onSelectStart: React.PropTypes.func,

    range: React.PropTypes.arrayOf(
      React.PropTypes.instanceOf(Date)
    ),
    rtl: React.PropTypes.bool,
    type: React.PropTypes.string,

    dayPropGetter: React.PropTypes.func,
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      selecting: false
    };
  }

  componentDidMount(){
    this.props.selectable
      && this._selectable()
  }

  componentWillUnmount() {
    this._teardownSelectable();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectable && !this.props.selectable)
      this._selectable();

    if (!nextProps.selectable && this.props.selectable)
      this._teardownSelectable();
  }

  render(){
    let { range, cellWrapperComponent: Wrapper, dayPropGetter } = this.props;
    let { selecting, startIdx, endIdx } = this.state;

    return (
      <div className='rbc-row-bg'>
        {range.map((date, index) => {
          let selected =  selecting && index >= startIdx && index <= endIdx;
          let dStyle = undefined
          let dClassName = undefined
          if (dayPropGetter) {
            const dayProps = dayPropGetter(date, dates.isToday(date));
            if (dayProps && dayProps.style)
              dStyle = dayProps.style;

            if (dayProps && dayProps.className)
              dClassName = dayProps.className;
          }
          return (
            <Wrapper key={index} value={date}>
              <div
                style={{
                  ...dStyle,
                  ...segStyle(1, range.length)
                }}
                className={cn(
                  'rbc-day-bg',
                  dClassName,
                  selected && 'rbc-selected-cell',
                  dates.isToday(date) && 'rbc-today',
                )}
              />
            </Wrapper>
          )
        })}
      </div>
    )
  }

  _selectable(){
    let node = findDOMNode(this);
    let selector = this._selector = new Selection(this.props.container)

    selector.on('selecting', box => {
      let { range, rtl } = this.props;

      let startIdx = -1;
      let endIdx = -1;

      if (!this.state.selecting) {
        notify(this.props.onSelectStart, [box]);
        this._initial = { x: box.x, y: box.y };
      }
      if (selector.isSelected(node)) {
        let nodeBox = getBoundsForNode(node);

        ({ startIdx, endIdx } = dateCellSelection(
            this._initial
          , nodeBox
          , box
          , range.length
          , rtl));
      }

      this.setState({
        selecting: true,
        startIdx, endIdx
      })
    })

    selector.on('mousedown', (box) => {
      if (this.props.selectable !== 'ignoreEvents') return

      return !isEvent(findDOMNode(this), box)
    })

    selector
      .on('click', point => {
        if (!isEvent(findDOMNode(this), point)) {
          let rowBox = getBoundsForNode(node)
          let { range, rtl } = this.props;

          if (pointInBox(rowBox, point)) {
            let width = slotWidth(getBoundsForNode(node),  range.length);
            let currentCell = getCellAtX(rowBox, point.x, width, rtl, range.length);

            this._selectSlot({
              startIdx: currentCell,
              endIdx: currentCell
            })
          }
        }

        this._initial = {}
        this.setState({ selecting: false })
      })

    selector
      .on('select', () => {
        this._selectSlot(this.state)
        this._initial = {}
        this.setState({ selecting: false })
        notify(this.props.onSelectEnd, [this.state]);
      })
  }

  _teardownSelectable() {
    if (!this._selector) return
    this._selector.teardown();
    this._selector = null;
  }

  _selectSlot({ endIdx, startIdx }) {
    if (endIdx !== -1 && startIdx !== -1)
      this.props.onSelectSlot &&
        this.props.onSelectSlot({
          start: startIdx, end: endIdx
        })
  }
}

export default BackgroundCells;
