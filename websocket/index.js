(() => {
  'use strict';

  const SocketDatas = require(`${__dirname}/socket-datas.js`);
  
  module.exports = (http, database) => {
    const io = require('socket.io')(http);
    const socketDatas = new SocketDatas(database);

    io.on('connection', async (socket) => {
      await socketDatas.set(socket.id, {
        openReplies: []
      });

      const socketDataEntities = await socketDatas.getSocketDatas();
      for (let i = 0; i < socketDataEntities.length; i++) {
        const socketDataEntity = socketDataEntities[i];
        const socketData = JSON.parse(socketDataEntity.data);
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