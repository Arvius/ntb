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
    if(fs.existsSync(this.settings.toxSave))
      this.readCmds(this.settings.cmdFile);
    else
      console.warn("No commands found.");
    this.tox = new toxcore.Tox();
    if(fs.existsSync(this.settings.toxSave))
      this.loadTox(this.settings.toxSave);

    this.tox.setNameSync(this.settings.name);
    this.tox.setStatusMessageSync(this.settings.status);
    this.tox.setUserStatusSync(0);

    //Register event handler
    this.tox.on('friendRequest', bind(this.handleFriendRequest, this));
    this.tox.on('friendMessage', bind(this.handleFriendMessage, this));
    process.on('SIGINT', bind(this.shutdown, this));

    var i, j, len; //Add bootstraps
    for (j = 0, len = this.settings.nodes.length; j < len; j++) {
      i = this.settings.nodes[j];
      this.tox.bootstrapFromAddressSync(i.address, i.port, i.key);
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

  NTB.prototype.loadTox = function(file) {
    stats = fs.statSync(file);
    if(!stats.isFile()) {
      return;
    }
    else {
      data = fs.readFileSync(file);
      this.tox.loadSync(data);
    }
  };

  NTB.prototype.saveTox = function(file) {
    this.tox.saveToFile(file);
  };

  NTB.prototype.shutdown = function() {
    this.writeSettings(this.pathSettings);
    this.tox.saveToFile(this.settings.toxSave, bind(function(){
      this.tox.kill(function() {
        process.exit(1);
      });
    }, this));
  };

  return NTB;
})();
module.exports = NTB;
