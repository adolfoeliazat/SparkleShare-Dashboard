var config = require('./config');

LinkCodeProvider = function() {
  this.validCodes = [];
};

LinkCodeProvider.prototype = {
  // 6 chars for linking code
  codeLen: 6,

  getNewCode: function(login) {
    this.gc();

    var code = Math.floor(Math.random() * Math.pow(10, this.codeLen)).toString();
    code = (new Array(this.codeLen - code.length + 1)).join("0") + code;

    this.validCodes.push({
      code: code,
      validUntil: (new Date()).getTime() + config.linkCodeValidFor * 1000,
      forLogin: login
    });

    return {code: code, validFor: config.linkCodeValidFor};
  },

  gc: function() {
    var now = (new Date()).getTime();
    var newValidCodes = [];

    for (var i = 0; i < this.validCodes.length; i++) {
      if (now < this.validCodes[i].validUntil) {
        newValidCodes.push(this.validCodes[i]);
      }
    }

    this.validCodes = newValidCodes;
  },

  isCodeValid: function(code) {
    var valid = false;
    var forLogin = null;
    var now = (new Date()).getTime();

    for (var i = 0; i < this.validCodes.length; i++) {
      if (this.validCodes[i].code == code && now < this.validCodes[i].validUntil) {
        this.validCodes[i].validUntil = 0;
        valid = true;
        forLogin = this.validCodes[i].forLogin;
        break;
      }
    }

    this.gc();
    return [valid, forLogin];
  }
};

exports.LinkCodeProvider = LinkCodeProvider;
