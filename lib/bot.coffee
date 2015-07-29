ToxFriendProtBase  = require './botProtocol/prot-toxFriendProtBase'

module.exports =
class Bot extends ToxFriendProtBase
  constructor: (params) ->
    @ntb = params.ntb
    @firstOnline = true
    @params = params

  online: ->
    return unless @firstOnline
    @pInitBotProtocol @params
    @firstOnline = false

  REQ_collabList: -> "drop"
  REQ_joinCollab: -> "drop"
