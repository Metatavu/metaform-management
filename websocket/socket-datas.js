(() => {
  'use strict';

  const redis = require("redis");
  const bluebird = require("bluebird");
  
  bluebird.promisifyAll(redis);

  /**
   * Redis storage for web socket data
   */
  class SocketDatas {

    /**
     * Constructor
     */
    constructor() {
      this.client = redis.createClient();
    }

    /**
     * Returns data for socket id
     * 
     * @param {String} socketId 
     * @returns {Promise} promise for data
     */
    async get(socketId) {
      const value = await this.client.getAsync(this.getKey(socketId));
      return value ? JSON.parse(value) : null;
    }

    /**
     * Sets data for socket id
     * 
     * @param {String} socketId 
     * @param {Object} data 
     * @returns {Promise} promise
     */
    async set(socketId, data) {
      await this.client.setAsync(this.getKey(socketId), JSON.stringify(data));
      const socketIds = await this.getSocketIds();
      if (socketIds.indexOf(socketId) === -1) {
        socketIds.push(socketId);
        await this.client.setAsync("socket-ids", JSON.stringify(socketIds))
      }
    }

    /**
     * Unsets data from socket id
     * 
     * @param {String} socketId
     * @returns {Promise} promise
     */
    async unset(socketId) {      
      await this.client.del(this.getKey(socketId));
      
      const socketIds = await this.getSocketIds();
      const socketIndex = socketIds.indexOf(socketId);

      if (socketIndex > -1) {
        socketIds.splice(socketIndex, 1);
        await this.client.setAsync("socket-ids", JSON.stringify(socketIds))
      }
    }

    /**
     * Returns connected socket ids
     */
    async getSocketIds() {
      return JSON.parse(await this.client.getAsync("socket-ids") || "[]");
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