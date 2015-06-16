toxcore = require 'toxcore'
fs      = require 'fs'

SEND_MSG_CMD_TYPE = 42

module.exports =
class NTB
  constructor: (opts) ->
    @pathSettings = opts.pathSettings

    return console.err "Settings not found." unless fs.existsSync @pathSettings
    @readSettings @pathSettings

    @friends = []
    opts = null

    opts = {'data': @getSave @settings.toxSave } if fs.existsSync @settings.toxSave
    @tox = new toxcore.Tox opts

    @tox.setNameSync          @settings.name
    @tox.setStatusMessageSync @settings.status
    @tox.setStatusSync        0 # TODO: use cons

    # Register event handler
    @tox.on 'friendRequest', (evt) => @handleFriendRequest evt
    @tox.on 'friendMessage', (evt) => @handleFriendMessage evt
    process.on 'SIGINT',     => @shutdown()

    @tox.bootstrapSync i.address, i.port, i.key for i in @settings.nodes

    console.log @tox.getAddressHexSync()
    @tox.start()

  readSettings: (file) ->
    data = fs.readFileSync file, 'utf8'
    data = JSON.parse data
    console.log data.toxSave
    @settings = data

  writeSettings: (file) ->
    data = JSON.stringify @settings, null, 2
    fs.writeFileSync file, data

  handleFriendRequest: (evt) ->
    @tox.addFriendNoRequestSync evt.publicKey()
    console.log "Accepted friend request from #{evt.publicKeyHex()}"

  handleFriendMessage: (evt) ->
    return unless evt.type() is SEND_MSG_CMD_TYPE
    # TODO do some stuff

  isAdmin: (friendKey) ->
    for i in @settings.admins
      return true if friendKey.toLowerCase() is i.key.toLowerCase()
    return false

  addAdmin: (name, friendKey) ->
    return if @isAdmin friendKey
    @settings.admins.push {'name': name, 'key': friendKey}
    console.log "New admin: #{friendKey}"
    @writeSettings @pathSettings

  removeAdmin: (friendKey) ->
    for index, i in @settings.admins
      if friendKey.toLowerCase() is i.key.toLowerCase()
        @settings.admins.splice(index, 1)
        console.log "Removed admin: #{i.key.toLowerCase()}"
        @writeSettings @pathSettings
        return true

    return false

  addFriend: (friendKey, friendId) -> @friends.push {'id': friendId, 'key': friendKey}

  removeFriend: (friendKey, friendId) ->
    for index, i in @friends
      if friendKey? and friendKey.toLowerCase() is i.key.toLowerCase()
        @friends.splice index, 1
        return true
      else if friendId? and friendId is i.id
        @friends.splice index, 1
        return true

    return false

  getSave: (file) ->
    stats = fs.statSync file
    return fs.readFileSync file if stats.isFile()
    return null

  saveTox: (file) -> fs.writeFileSync file, @tox.getSavedataSync()

  shutdown: ->
    console.log "Shutting down..."
    @writeSettings @pathSettings
    @saveTox       @settings.toxSave
    @tox.kill   => process.exit 0

### Old handleFriendMessage
  NTB.prototype.handleFriendMessage = function(evt) {
    msg = evt.message().split(' ')
    var i, j, len
    for (j = 0, len = @cmds.length j < len j++) {
      i = @cmds[j]
      if(msg[0] == i.s) {
        if(msg.length < i.n + 1) {
          @tox.sendMessageSync(evt.friend(), "Too less arguments.")
          continue
        }
        if(i.p && @isAdmin(@tox.getFriendPublicKeyHexSync(evt.friend())))
          i.c(evt.friend(), msg)
        else if(i.p == false)
          i.c(evt.friend(), msg)
        else
          @tox.sendMessageSync(evt.friend(), "You don't have the required permissions.")
      }
    }
  }
###
