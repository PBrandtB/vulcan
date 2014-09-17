/** @jsx React.DOM */
var React = require('react/addons');
var AppHeader = require('./header');
var Root = require('./root');
var LoginForm = require('./form-login');
var EditForm = require('./form-edit');
var EventHub = require('./eventhub');
var AppMixins = require('./mixins');

var errorMessages = {
  PERMISSION_DENIED: 'You do not have permission to write data at this location.',
  PERMISSION_DENIED_READ: 'You do not have permission to view this Firebase.',
  INVALID_TOKEN: 'The token you entered is not valid.'
};

module.exports = React.createClass({
  mixins: [AppMixins],

  getInitialState: function() {
    //Check if running Vulcan in Chrome Dev Tools Panel
    var isDevTools = (this.props.options && this.props.options.isDevTools) ? true: false;

    // Default pinning options
    var pinnedOptions = {
      top: false,
      left: false,
      right: true,
      bottom: true
    }

    // Pin to all 4 sides for dev tools
    if(isDevTools) {
      pinnedOptions = {
        top: true,
        left: true,
        right: true,
        bottom: true
      }
    }

    return {
      status: 'new',
      firebaseRef: null,
      url: '',
      token: '',
      formAction: null,
      node: null,
      loginAuthError: '',
      minimized: false,
      pinned: pinnedOptions,
      isDevTools: isDevTools
    };
  },

  componentWillMount: function() {
    EventHub.subscribe('add', this.showForm);
    EventHub.subscribe('priority', this.showForm);
    EventHub.subscribe('edit', this.showForm);
    EventHub.subscribe('error', this.showError);
    EventHub.subscribe('reset', this.resetApp);
  },

  showForm: function(name, node) {
    this.setState({
      formAction: name,
      node: node
    });
  },

  showError: function(event, error) {
    var message = errorMessages[error] || 'Sorry there was a problem with your request';

    this.setState({
      error: message
    });
  },

  hideError: function(e) {
    if(e && e.preventDefault) {
      e.preventDefault();
    }

    this.setState({error: ''});
  },

  closeForm: function() {
    this.setState({
      formAction: null,
      node: null
    });
  },

  resetApp: function(event, error) {
    this.setState({
      status: 'new',
      firebaseRef: null,
      url: '',
      token: '',
      formAction: null,
      node: null,
      loginAuthError: '',
      minimized: false,
    });

    if(error && error === 'PERMISSION_DENIED') {
      this.showError(null, 'PERMISSION_DENIED_READ');
    }
  },

  login: function(data) {
    //CLEAR ERROR MESSAGES
    this.setState({loginAuthError: null});

    var firebase = new Firebase(data.url);
    var token = data.token || this.state.token;

    //AUTHENTICATE
    if(token) {
      this.authenticate(firebase, token, data.url);
    }
    else {
      this.setState({url: data.url, firebaseRef: firebase});
    }
  },

  authenticate: function(firebase, token, url) {
    firebase.auth(token, function(error, result) {
      if(error && error.code) {
        this.setState({ loginAuthError: error.code });
      }
      else {
        this.setState({
          url: url,
          token: token,
          firebaseRef: firebase
        });
      }
    }.bind(this));
  },

  minimize: function() {
    if (!this.state.minimized){
      this.toggleHide();
    }
  },

  toggleHide: function(){
    this.setState({minimized: !this.state.minimized});
  },

  collapseAll: function() {
    EventHub.publish('collapseAll');
  },

  expandAll: function() {
    EventHub.publish('expandAll');
  },

  logout: function() {
    //UNAUTHENTICATE
    this.state.firebaseRef.unauth();

    this.setState({
      formAction: null,
      node: null,
      status: 'new',
      firebaseRef: null,
      url: '',
      token: ''
    });
  },

  changeURL: function(data) {
    var firebase = new Firebase(data.url);

    //RESET
    this.setState({
      formAction: null,
      node: null,
      status: 'new',
      firebaseRef: null,
      url: '',
      token: '',
      error: ''
    },
    function() {
      //USE NEW FIREBASE REF
      this.setState({
        url: data.url,
        firebaseRef: firebase
      });
    }.bind(this));
  },

  headerAction: function(action) {
    switch(action.type) {
      case 'minimize':  this.minimize();                 break;
      case 'collapse':  this.collapseAll();              break;
      case 'expand':    this.expandAll();                break;
      case 'logout':    this.logout();                   break;
      case 'url':       this.changeURL(action);          break;
    }
  },

  renderErrorMessage: function() {
    var pclass = this.prefixClass;
    var message = '';

    if(this.state.error) {
      message = (
        <div className={pclass(['alert', 'alert-error'])}>
          {this.state.error}
          <a href="#" onClick={this.hideError} className={pclass('alert-close')}>x</a>
        </div>
      );
    }

    return message;
  },

  render: function() {
    var pclass = this.prefixClass;
    var cx = React.addons.classSet;

    // compute classes for app body including show/hide
    var computeClasses = function(){

      var classes = "";
      if (this.state.minimized) {
        classes += "hide ";
      }

      classes += pclass("app-body");
      return classes;

    }.bind(this);

    var checkStateOfParent = function(stateKey){
      return (this.state[stateKey]);
    }.bind(this);

    var setStateOfParent = function(stateKey, val){
      var newState = {};
      newState[stateKey] = val;
      this.setState(newState);
    }.bind(this);

    //OPTIONS FOR PINNING STATE
    var classes = cx({
      'l-pinned-top': this.state.pinned.top,
      'l-pinned-bottom': this.state.pinned.bottom,
      'l-pinned-left': this.state.pinned.left,
      'l-pinned-right': this.state.pinned.right,
      'l-pinned-all': this.state.pinned.top && this.state.pinned.bottom && this.state.pinned.left && this.state.pinned.right,
      'l-pinned': true,
      'app-container':true,
      'is-devtools': this.state.isDevTools
    });

    return (
      <div className={pclass(classes)}>
        <AppHeader onHeaderAction={this.headerAction} isDevTools={this.state.isDevTools} url={this.state.url} showDropdown={false} checkStateOfParent={checkStateOfParent} setStateOfParent={setStateOfParent} />

        <div className={computeClasses()} ref="appBody">
          {this.renderErrorMessage()}

          {function(){
            if(this.state.firebaseRef) {
              return <Root firebaseRef={this.state.firebaseRef} />
            }
            else {
              return (
                <div>
                  <LoginForm authError={this.state.loginAuthError} isDevTools={this.state.isDevTools} onLogin={this.login} />
                  <a className={pclass("badge")} href="https://www.firebase.com/" target="_blank">Firebase Inc.</a>
                </div>
              );
            }
          }.bind(this)()}
        </div>


        {function(){
          if(this.state.firebaseRef && this.state.formAction){
            return <EditForm node={this.state.node} isDevTools={this.state.isDevTools} action={this.state.formAction} onComplete={this.closeForm} status="changed"/>
          }
        }.bind(this)()}

      </div>
    );
  }
});
