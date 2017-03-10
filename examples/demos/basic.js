import React from 'react';
import BigCalendar from 'react-big-calendar';
import events from '../events';

const rDay = '0,2'

let Basic = React.createClass({
  render(){
    return (
      <BigCalendar
        {...this.props}
        events={events}
        dayPropGetter={(date, isToday) => {
          const day = (new Date(date)).getDay()
          if (rDay.indexOf(day) !== -1) {
            return { style: { backgroundColor: 'DarkGray' } }
          }
          return {}
        }}
      />
    )
  }
})

export default Basic;
