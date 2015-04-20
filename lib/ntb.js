var toxcore = require('toxcore');
var fs = require('fs');

var bind = function(func, thisValue) {
  return function() {
    return func.apply(thisValue, arguments);
  }
}

var NTB = (function() {
  function NTB(opts) {
    this.pathSettings = opts.pathSettings;
    if(!fs.existsSync(this.pathSettings))
      return console.err("Settings not found.");
    this.readSettings(this.pathSettings);
    if(fs.existsSync(this.settings.cmdFile))
      this.readCmds(this.settings.cmdFile);
    else
      console.warn("No commands found.");

    this.friends = [];

    var opts = null;
    if(fs.existsSync(this.settings.toxSave))
      opts = {'data': this.getSave(this.settings.toxSave)};
    this.tox = new toxcore.Tox(opts);

    this.tox.setNameSync(this.settings.name);
    this.tox.setStatusMessageSync(this.settings.status);
    this.tox.setStatusSync(0); //TODO: use cons

    //Register event handler
    this.tox.on('friendRequest', bind(this.handleFriendRequest, this));
    this.tox.on('friendMessage', bind(this.handleFriendMessage, this));
    process.on('SIGINT', bind(this.shutdown, this));

    var i, j, len; //Add bootstraps
    for (j = 0, len = this.settings.nodes.length; j < len; j++) {
      i = this.settings.nodes[j];
      this.tox.bootstrapSync(i.address, i.port, i.key);
    }

    console.log(this.tox.getAddressHexSync());
    this.tox.start();
  }

  NTB.prototype.readSettings = function(file) {
    data = fs.readFileSync(file, 'utf8');
    data = JSON.parse(data);
    console.log(data.toxSave);
    this.settings = data;
  };

  NTB.prototype.writeSettings = function(file) {
    data = JSON.stringify(this.settings, null, 2);
    fs.writeFileSync(file, data);
  };

  NTB.prototype.readCmds = function(file) {
    fs = require('fs');
    data = fs.readFileSync(file, 'utf8');
    data = eval(data);
    this.cmds = data;
  };

  NTB.prototype.handleFriendRequest = function(evt) {
    this.tox.addFriendNoRequestSync(evt.publicKey());
    console.log('Accepted friend request from ' + evt.publicKeyHex());
  };

  NTB.prototype.handleFriendMessage = function(evt) {
    msg = evt.message().split(' ');
    var i, j, len;
    for (j = 0, len = this.cmds.length; j < len; j++) {
      i = this.cmds[j];
      if(msg[0] == i.s) {
        if(msg.length < i.n + 1) {
          this.tox.sendMessageSync(evt.friend(), "Too less arguments.");
          continue;
        }
        if(i.p && this.isAdmin(this.tox.getFriendPublicKeyHexSync(evt.friend())))
          i.c(evt.friend(), msg);
        else if(i.p == false)
          i.c(evt.friend(), msg);
        else
          this.tox.sendMessageSync(evt.friend(), "You don't have the required permissions.");
      }
    }
  };

  NTB.prototype.isAdmin = function(friendKey) {
    var i, j, len;
    for (j = 0, len = this.settings.admins.length; j < len; j++) {
      i = this.settings.admins[j];
      if(friendKey.toLowerCase() == i.key.toLowerCase())
        return true;
    }
    return false;
  };

  NTB.prototype.addAdmin = function(name, friendKey) {
    if(this.isAdmin(friendKey))
      return;
    this.settings.admins.push({"name": name, "key": friendKey})
    console.log("New admin:", friendKey);
    this.writeSettings(this.pathSettings);
  };

  NTB.prototype.removeAdmin = function(friendKey) {
    var i, j, len;
    for (j = 0, len = this.settings.admins.length; j < len; j++) {
      i = this.settings.admins[j];
      if(friendKey.toLowerCase() == i.key.toLowerCase()) {
        this.settings.admins.splice(j, 1);
        console.log("Removed admin:", i.key.toLowerCase());
        this.writeSettings(this.pathSettings);
        return true;
      }
    }
    return false;
  };

  NTB.prototype.addFriend = function(friendKey, friendId) {
    var i, j, len;
    for (j = 0, len = this.friends.length; j < len; j++) {
      i = this.friends[j];
      if(friendKey.toLowerCase() == i.key.toLowerCase())
        return false;
    }
    this.friends.push({'id': friendId, 'key': friendKey});
  };

  NTB.prototype.removeFriend = function(friendKey, friendId) {
    var i, j, len;
    for (j = 0, len = this.friends.length; j < len; j++) {
      i = this.friends[j];
      if(friendKey && friendKey.toLowerCase() == i.key.toLowerCase()) {
        this.friends.splice(j, 1);
        return true;
      }
      else if(friendId && friendId.toLowerCase() == i.id.toLowerCase()) {
        this.friends.splice(j, 1);
        return true;
      }
    }
    return false;
  };

  NTB.prototype.getSave = function(file) {
    var stats = fs.statSync(file);
    if(!stats.isFile())
      return;
    else
      return fs.readFileSync(file);
  };

  NTB.prototype.saveTox = function(file) {
    var data = this.tox.getSavedataSync();
    fs.writeFileSync(file, data);
  };

  NTB.prototype.shutdown = function() {
    this.writeSettings(this.pathSettings);
    this.saveTox(this.settings.toxSave);
    this.tox.kill(function() {
        process.exit(1);
    });
  };

  return NTB;
})();
module.exports = NTB;
