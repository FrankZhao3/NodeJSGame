// New socket connection
export function onSocketConnection (username) {
    util.log('New player has connected: ' + username)
  
    // Listen for client disconnected
    client.on('disconnect', onClientDisconnect)
  
    // Listen for new player message
    client.on('new player', onNewPlayer)
  
    // Listen for move player message
    client.on('move player', onMovePlayer)
  }

  // Socket client has disconnected
function onClientDisconnect () {
    util.log('Player has disconnected: ' + this.id)
}

// New player has joined
function onNewPlayer (data) {

}

// Player has moved
function onMovePlayer (data) {

}