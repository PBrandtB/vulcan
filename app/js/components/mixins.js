/*
* REACT MIXINS
*
* Custom mixins for use in React components
*/

module.exports = {

  /*
  * cleanFormField
  *
  * Takes the string value from a form field
  * and returns a number, string, or null.
  */

  cleanFormField: function(value) {
    value = value.trim();

    //If value is a number, return a real number
    if(!isNaN(value) && value !== '') {
      value = Number(value);
    }
    else {
      value = value || null;
    }

    return value;
  },


  /*
  * hasPriority
  *
  * Check if the value is a valid priority
  * and returns true or false.
  */

  hasPriority: function(priority) {
    var hasPriority = false;

    //If priority is a number, return a real number

    if(priority === null || priority === undefined || priority === '') {
      hasPriority = false;
    }
    else {
      hasPriority = true;
    }

    return hasPriority;
  },


  /*
  * prefixClass
  *
  * Prefixes css names spaces with  the prefix
  * var used below. This is to help avoid namespace
  * conflicts if you choose to import Vulcan into
  * a webpage when debugging.
  */

  prefixClass: function(name) {
    var prefix = 'vulcan';
    // Convert the name to an array
    if (!Array.isArray(name)) {
      name = name.split(' ');
    }
    return name.reduce(function(classString, className) {
      return classString + ' ' + prefix + '-' + className;
    }, '').replace(/^\s|\s$/g, '');
  }
};