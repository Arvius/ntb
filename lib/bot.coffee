ToxFriendProtBase  = require './botProtocol/prot-toxFriendProtBase'

module.exports =
class Bot extends ToxFriendProtBase
  constructor: (params) ->
    @ntb = params.ntb
    @pInitBotProtocol params
