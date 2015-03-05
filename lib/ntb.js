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
      {s: '/githubauth', n: 1, c: this.callback, p: false},
      {s: '/ping', n: 0, c: this.callback, p: false}
    ];

    this.readSettings(opts.pathSettings);
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
    //TODO
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
        console.log(i.s, msg[1]);
        //i.c(msg);
      }
    }
    this.tox.sendMessageSync(evt.friend(), evt.message());
  };

  NTB.prototype.addAdmin = function(name, friendId) {
    var i, j, len;
    for (j = 0, len = this.settings.admins.length; j < len; j++) {
      i = this.settings.admins[j];
      if(friendId == i.id)
        return;
    }
    this.settings.admins.push({"name": name, "id": friendId})
    console.log("New admin: ", friendId);
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
    this.tox.saveToFile(this.settings.toxSave, bind(function(){
      this.tox.kill(function() {
        process.exit(1);
      });
    }, this));
  };

  return NTB;
})();
module.exports = NTB;
