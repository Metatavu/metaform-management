(() => {
    "use strict";
  
    module.exports = {
  
      up: async (query, Sequelize) => {
        await query.createTable("ReplyDrafts", {
          id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
          formData: Sequelize.TEXT('long'),
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        });
      }
  
    };
  
  })();