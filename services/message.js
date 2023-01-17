const utils = require('../utils/utils');

class MessageService {
  constructor(io) {
    this.io = io;
  }

  sendMessage(room, data) {
    let message = utils.formatMessageData(data);
    this.io.sockets.in(room).emit("receive-message", message);
  }
}

module.exports = { MessageService };