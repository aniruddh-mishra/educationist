// import React, { Component } from "react";
// import ReactDOM from "react-dom";

const dbRef = firebase.database().ref();
var content = {}
refresh()

function refresh() {
    dbRef.child("Content Catalog").get().then((data) => {
    if (data.exists()) {
        content = data.val();
    } else {
        console.log("No data available");
    }
    }).catch((error) => {
    console.error(error);
    });
}

const buttonStyle = {
    color: 'green'
}
class Toggle extends React.Component {
    constructor(props) {
      super(props);
      this.state = {isToggleOn: true};
      this.handleClick = this.handleClick.bind(this);
    }
  
    handleClick() {
        this.setState(prevState => ({
            isToggleOn: !prevState.isToggleOn
        }));
    }
  
    render() {
      return (
        <button onClick={this.handleClick}>
          <h1 style={buttonStyle}>{this.state.isToggleOn ? 'ON' : 'OFF'}</h1>
        </button>
      );
    }
  }
  
  ReactDOM.render(
    <Toggle />,
    document.querySelector('.container')
  );