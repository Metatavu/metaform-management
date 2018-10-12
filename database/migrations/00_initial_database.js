(() => {
    "use strict";
  
    module.exports = {
  
      up: async (query, Sequelize) => {
        console.log("juuu");

        
        await query.createTable("ConnectSessions", {
          sid: { type: Sequelize.STRING(191), primaryKey: true },
          userId: Sequelize.STRING(191),
          expires: Sequelize.DATE,
          data: Sequelize.TEXT,
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        });
  
        await query.createTable("SocketData", {
          socketId: { type: Sequelize.STRING(191), primaryKey: true, allowNull: false },
          data: Sequelize.STRING(191),
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        });

        await query.createTable("ReplyDrafts", {
          replyId: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
          reply: Sequelize.TEXT('long'),
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        });
      }
  
    };
  
  })();