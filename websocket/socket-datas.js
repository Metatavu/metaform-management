(() => {
  "use strict";

  /**
   * Database storage for web socket data
   */
  class SocketDatas {

    /**
     * Constructor
     */
    constructor(database) {
      this.database = database;
    }

    /**
     * Returns data for socket id
     * 
     * @param {String} socketId 
     * @returns {Promise} promise for data
     */
    async get(socketId) {
      const socketData = await this.database.findSocketData(socketId);
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
      await this.database.upsertSocketData(socketId, JSON.stringify(data));
    }

    /**
     * Unsets data from socket id
     * 
     * @param {String} socketId
     * @returns {Promise} promise
     */
    async unset(socketId) {
      await this.database.deleteSocketData(socketId);
    }

    /**
     * Returns connected socket ids
     */
    async getSocketDatas() {
      return this.database.listSocketDatas();
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