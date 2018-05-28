(() => {
  'use strict';

  const SocketDatas = require(`${__dirname}/socket-datas.js`);
  const socketDatas = new SocketDatas();
  
  module.exports = (http) => {
    const io = require('socket.io')(http);
    
    io.on('connection', async (socket) => {
      await socketDatas.set(socket.id, {
        openReplies: []
      });

      const socketIds = await socketDatas.getSocketIds();
      for (let i = 0; i < socketIds.length; i++) {
        const socketId = socketIds[i];
        const socketData = await socketDatas.get(socketId);
        const openReplies = socketData && socketData.openReplies ? socketData.openReplies : [];

        for (let j = 0; j < openReplies.length; j++) {
          socket.emit('reply:locked', openReplies[j]);
        }
      }
      
      socket.on('reply:opened', async (data) => {
        const socketData = await socketDatas.get(socket.id);
        const openReplies = socketData && socketData.openReplies ? socketData.openReplies : [];
        const replyIndex = openReplies.indexOf(data.replyId);

        if (replyIndex < 0) {
          openReplies.push(data.replyId); 
          await socketDatas.set(socket.id, {
            openReplies: openReplies
          });
        }
        
        io.emit('reply:locked', data.replyId);
      });
      
      socket.on('reply:closed', async (data) => {
        const socketData = await socketDatas.get(socket.id);
        const openReplies = socketData && socketData.openReplies ? socketData.openReplies : [];
        const replyIndex = openReplies.indexOf(data.replyId);
        
        if (replyIndex > -1) {
          openReplies.splice(replyIndex, 1);
          await socketDatas.set(socket.id, {
            openReplies: openReplies
          });
        }

        io.emit('reply:unlocked', data.replyId);
      });
      
      socket.on('disconnect', async () => {
        const socketData = await socketDatas.get(socket.id);
        const openReplies = socketData && socketData.openReplies ? socketData.openReplies : [];

        for (let i = 0; i < openReplies.length; i++) {
          io.emit('reply:unlocked', openReplies[i]);
        }
        
        await socketDatas.unset(socket.id); 
      });
    });
  };
  
  
})();