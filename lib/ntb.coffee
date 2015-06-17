fs      = require 'fs'

Bot        = require './bot'
ToxWorker  = require './toxWorker'
BotManager = require './botProtocol/prot-botManager'

module.exports =
class NTB
  constructor: (opts) ->
    @pathSettings = opts.pathSettings

    return console.err "Settings not found." unless fs.existsSync @pathSettings
    @readSettings @pathSettings

    @friends   = []
    @manager   = new BotManager {}
    @toxWorker = new ToxWorker  {
      "ntb":      this
      "name":     @settings.name
      "status":   @settings.status
      "saveFile": @settings.toxSave
      "nodes":    @settings.nodes
    }

    process.on 'SIGINT',  => @shutdown()
    process.on 'SIGTERM', => @shutdown()

    @toxWorker.startup()

  readSettings: (file) ->
    data = fs.readFileSync file, 'utf8'
    data = JSON.parse data
    @settings = data
    console.log "Tox save file: #{@settings.toxSave}"

  writeSettings: (file) ->
    data = JSON.stringify @settings, null, 2
    fs.writeFileSync file, data

  addFriend: (params) ->
    params.ntb = this
    params.manager = @manager

    @friends[params.id] = new Bot params

  removeFriend: (friendKey, friendId) ->
    for index, i in @friends
      if friendKey? and friendKey.toLowerCase() is i.pKey.toLowerCase()
        @friends.splice index, 1
        return true
      else if friendId? and friendId is i.pID
        @friends.splice index, 1
        return true

    return false

  shutdown: ->
    console.log "Shutting down..."
    @toxWorker.shutdown()
    @writeSettings @pathSettings

    process.exit 0
