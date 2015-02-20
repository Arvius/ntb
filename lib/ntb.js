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
      {s: '', n: 0, c: this.callback, p: false},
      {s: '', n: 0, c: this.callback, p: false}
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

  NTB.prototype.handleFriendRequest = function(evt) {
    this.tox.addFriendNoRequestSync(evt.publicKey());
    console.log('Accepted friend request from ' + evt.publicKeyHex());
  };

  NTB.prototype.handleFriendMessage = function(evt) {
    if(evt.message().indexOf("#0.0.1!auth ") > -1) {
      str = evt.message().split(' ');
      console.log(str[0], str[1], str[2]);
      this.tox.sendMessageSync("Auth request received.", evt.friend());
    }
    this.tox.sendMessageSync(evt.message(), evt.friend());
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
