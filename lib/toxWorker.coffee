toxcore = require 'toxcore'
fs      = require 'fs'

SEND_MSG_CMD_TYPE = 42

module.exports =
class ToxWorker
  constructor: (params) ->
    @ntb      = params.ntb
    @saveFile = params.saveFile
    @name     = params.name
    @status   = params.status
    @nodes    = params.nodes

  startup: ->
    toxOpts = {'data': @getSave @saveFile } if fs.existsSync @saveFile
    @tox = new toxcore.Tox toxOpts

    @setNameAndStatus  @name, @status
    @tox.setStatusSync 0 # TODO: use cons

    # Register event handler
    @tox.on 'friendRequest', (evt) => @handleFriendRequest evt
    @tox.on 'friendMessage', (evt) => @handleFriendMessage evt

    @tox.bootstrapSync i.address, i.port, i.key for i in @nodes

    console.log "TOX id: #{@tox.getAddressHexSync()}"
    @tox.start()

  setNameAndStatus: (name, status) ->
    @tox.setNameSync          name
    @tox.setStatusMessageSync status

  handleFriendRequest: (evt) ->
    fID = @tox.addFriendNoRequestSync evt.publicKey()
    @ntb.addFriend {
      "id":      fID
      "pubKey":  evt.publicKey()
      "sendCB":  (msg) => @sendCMD fID, msg
    }

    console.log "Accepted friend request from #{evt.publicKeyHex()}"

  handleFriendMessage: (evt) ->
    return unless evt.type() is SEND_MSG_CMD_TYPE
    if not friends[evt.friend()]?
      console.log "Fatal error: Friend #{evt.friend()} not found"
      console.log "  MSG: #{evt.message()}"
      return
    friends[evt.friend()].pReceivedCommand evt.message()

  sendCMD: (fID, msg) ->
    try
      return @TOX.sendFriendMessageSync fID, msg, SEND_MSG_CMD_TYPE
    catch e
      console.log "ERROR: Failed to send message"
      console.log "  Friend ID: #{fID}"
      console.log "  Message:   #{msg}"
      return -1

  getSave: (file) ->
    stats = fs.statSync file
    return fs.readFileSync file if stats.isFile()
    return null

  shutdown: ->
    console.log " - shutting down TOX..."
    fs.writeFileSync @saveFile, @tox.getSavedataSync()
    @tox.killSync()
