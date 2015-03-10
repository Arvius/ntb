[
  {s: '/githubauth', n: 0, c: bind(function(fid, msg){
    this.tox.sendMessageSync(fid, "Not yet implemented.");
  }, this), p: true},
  {s: '/ping', n: 0, c: bind(function(fid, msg){
    this.tox.sendMessageSync(fid, msg.join(' '));
  }, this), p: false},
  {s: '/listAdmins', n: 0, c: bind(function(fid, msg){
    var i, j, len;
    for (j = 0, len = this.settings.admins.length; j < len; j++) {
      i = this.settings.admins[j];
      this.tox.sendMessageSync(fid, i.name + ":" + i.key);
    }
  }, this), p: true},
  {s: '/removeAdmin', n: 1, c: bind(function(fid, msg){
    pubKey = msg[1].substring(0, 64).toLowerCase();
    if(this.removeAdmin(pubKey))
      msg = "Removed admin: " + pubKey;
    else
      msg = "No admin with this key found."
    this.tox.sendMessageSync(fid, msg);
  }, this), p: true},
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
]
