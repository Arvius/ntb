var toxcore = require('toxcore');
var fs = require('fs');

var bind = function(func, thisValue) {
  return function() {
    return func.apply(thisValue, arguments);
  }
}

var NTB = (function() {
  function NTB(opts) {
    this.cmds = [
      {s: '/githubauth', n: 0, c: bind(function(fid, msg){
        this.tox.sendMessageSync(fid, "Not yet implemented.");
      }, this), p: true},
      {s: '/ping', n: 0, c: bind(function(fid, msg){
        this.tox.sendMessageSync(fid, msg.join(' '));
      }, this), p: false},
      {s: '/addAdmin', n: 2, c: bind(function(fid, msg){
        pubKey = msg[2].substring(0, 64).toLowerCase();
        this.addAdmin(msg[1], pubKey);
        this.tox.sendMessageSync(fid, "New Admin: " + msg[1] + ":" + pubKey);
      }, this), p: true},
      {s: '/help', n: 0, c: bind(function(fid, msg){
        var i, j, len;
        for (j = 0, len = this.cmds.length; j < len; j++) {
          i = this.cmds[j];
          this.tox.sendMessageSync(fid, i.s + " " + i.n);
        }
      }, this), p: false}
    ];

    this.pathSettings = opts.pathSettings
    this.readSettings(this.pathSettings);
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
    fs = require('fs');
    data = fs.readFileSync(file, 'utf8');
    data = JSON.parse(data);
    console.log(data.toxSave);
    this.settings = data
  };

  NTB.prototype.writeSettings = function(file) {
    fs = require('fs');
    data = JSON.stringify(this.settings, null, 2);
    fs.writeFileSync(file, data);
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
    var i, j, len;
    if(this.isAdmin(friendKey))
      return;
    this.settings.admins.push({"name": name, "key": friendKey})
    console.log("New admin:", friendKey);
    this.writeSettings(this.pathSettings);
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
