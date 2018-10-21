(() => {
  "use strict";

  const database = require(`${__dirname}/../database`);

  /**
   * Database storage for web socket data
   */
  class SocketDatas {

    /**
     * Constructor
     */
    constructor() {
    }

    /**
     * Returns data for socket id
     * 
     * @param {String} socketId 
     * @returns {Promise} promise for data
     */
    async get(socketId) {
      const socketData = await database.findSocketData(socketId);
      return socketData && socketData.value ? JSON.parse(socketData.value) : null;
    }

    /**
     * Sets data for socket id
     * 
     * @param {String} socketId 
     * @param {Object} data 
     * @returns {Promise} promise
     */
    async set(socketId, data) {
      await database.upsertSocketData(socketId, JSON.stringify(data));
    }

    /**
     * Unsets data from socket id
     * 
     * @param {String} socketId
     * @returns {Promise} promise
     */
    async unset(socketId) {
      await database.deleteSocketData(socketId);
    }

    /**
     * Returns connected socket ids
     */
    async getSocketDatas() {
      return database.listSocketDatas();
    }

    /**
     * Returns key for socket id
     * 
     * @param {String} socketId 
     * @returns key for socket id
     */
    getKey(socketId) {
      return `socket-${socketId}`
    }

  }

  module.exports = SocketDatas;

})();