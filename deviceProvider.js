var fs = require('fs');

DeviceProvider = function(filename, next) {
  if (filename) {
    this.filename = filename;
  } else {
    this.filename = null;
  }
  this.devices = [];
  
  this.loadFromFile(next);
};

DeviceProvider.prototype = {
  loadFromFile: function(next) {
    if (!this.filename) { throw new Error('No filename specified'); }

    var provider = this;

    fs.readFile(this.filename, 'utf8', function(error, data) {
      provider.devices = [];

      if (!error) {
        var u = JSON.parse(data);

        for (var i = 0; i < u.length; i++) {
          var mydevice = new Device(u[i]);
          provider.devices.push(mydevice);
        }
      }

      if (next) {
        next();
      }
    });
  },

  saveToFile: function(next) {
    if (!this.filename) { return next(new Error('No filename specified')); }

    fs.writeFile(this.filename, JSON.stringify(this.devices), 'utf8', function(error) {
      if (error) { return next(error); }
      return next(null);
    });
  },

  createNew: function(name, login, next) {
    var provider = this;

    var newDevice = new Device();
    newDevice.name = name;
    newDevice.owner = login;

    provider.devices.push(newDevice);
    provider.saveToFile(function(error) {
      if (error) { return next(error); }
      next(null, newDevice);
    });
  },

  findAll: function(next) {
    next(null, this.devices.slice());
  },

  findByUser: function(user, next) {
    var result = [];

    if (user.admin) {
      result = this.devices;
    } else {
      for (var i = 0; i < this.devices.length; i++) {
        if (this.devices[i].owner == user.login) {
          result.push(this.devices[i]);
        }
      }
    }

    next(null, result);
  },

  findByDeviceIdent: function(ident, next) {
    var result = null;
    var resultId = null;

    for (var i = 0; i < this.devices.length; i++) {
      if (this.devices[i].ident == ident) {
        result = this.devices[i];
        resultId = i;
        break;
      }
    }

    if (next) {
      next(null, result);
    }

    return resultId;
  },

  updateDevice: function(device, next) {
    var id = this.findByDeviceIdent(device.ident);
    if (id === null) {
      return next(new Error('No such device'));
    }
    
    this.devices[id] = device;
    this.saveToFile(function(error) {
      if (error) { return next(error); }
      return next(null, device);
    });
  },

  unlinkDevice: function(ident, next) {
    var id = this.findByDeviceIdent(ident);
    if (id === null) {
      return next(new Error('No such device'));
    }

    this.devices.splice(id, 1);
    this.saveToFile(function(error) {
      if (error) { return next(error); }
      return next(null);
    });
  }
};

Device = function(data) {
  if (data) {
    this.ident = data.ident;
    this.authCode = data.authCode;
    this.name = data.name;
    this.owner = data.owner;
  } else {
    this.ident = this.genIdent();
    this.authCode = this.genAuthCode();
    this.name = "";
    this.owner = null;
  }
};

Device.prototype = {
  genCode: function(len) {
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_";
    var salt = '';

    for (var i=0; i < len; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  },

  genIdent: function() {
    return this.genCode(8);
  },

  genAuthCode: function() {
    return this.genCode(200);
  },

  checkAuthCode: function(authCode) {
    return this.authCode == authCode;
  }
};

exports.DeviceProvider = DeviceProvider;
