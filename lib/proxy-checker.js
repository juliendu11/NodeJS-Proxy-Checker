"use strict";

const fs = require("fs");
const request = require("request");
const proxy = require("./proxy-checker/classes/proxy");

class ProxyChecker {
  constructor() {
    this.filePath = undefined;
    this.proxies = [];
    this.myIP = undefined;
  }

  /**
   * To recover proxies from a file
   * @param {string} filePath file path
   */
  setProxiesListFromFile(filePath) {
    this.filePath = filePath;
    return new Promise((resolve, reject) => {
      fs.readFile(
        filePath,
        "utf8",
        function (err, contents) {
          if (err) throw err;
          let values = contents.toString().split("\r\n");
          this.setProxies(values);
          resolve();
        }.bind(this)
      );
    });
  }

  /**
   * To recover proxies from a string []
   * @param {string[]} proxies
   */
  setProxiesListFromArray(proxies) {
    this.setProxies(proxies);
  }

  setProxies(values) {
    if (values.length != 1) {
      for (var i in values) {
        this.proxies.push(
          new proxy(values[i].split(":")[0], values[i].split(":")[1], this.myIP)
        );
      }
    } else {
      this.proxies.push(
        new proxy(values[0].split(":")[0], values[0].split(":")[1], this.myIP)
      );
    }
  }

/**
 * @typedef {Object} Result
 * @property {boolean} result - Result of process
 * @property {string} anonymous
 * @property {string} country
 */

  /**
   * Check juste on proxy, it's promise methods.
   *
   * @param {string} value - proxy, format: 'address:port'
   * @returns {Result}
   */
  async checkOneProxy(value) {
    await this.getMyIP();
      var p = new proxy(value.split(":")[0], value.split(":")[1], this.myIP);
      await p.checkProxy();

      return {
        result: !p.status == "Dead",
        anonymous: p.status == "Dead" ? "" : p.anonymous,
        country: p.status == "Dead" ? "" : p.country,
      };
  }

  /**
   * Check all proxies in file, it's promise methods.
   * @param {Object} [options] - (optionnal) It's an object
   * @param {string} [options.goodProxiesPath] - If you want to create a file containing the correct proxies, put the path here.
   * @param {string} [options.badProxiesPath] - If you want to create a file containing the correct proxies, put the path here.
   * @param {boolean} [options.showAnonymous] - Display anonymous value in the good proxies file.
   * @param {boolean} [options.showCountry] - Display country value in the good proxies file.
   * @param {boolean} [options.deleteFileIfExist] - Delete good and bad proxies file if exist
   */
  async checkProxies(options = {}) {
    var goodProxiesFileStream = null;
    var badProxiesFileStream = null;
    if (options != null && options != {}) {
      if (options.goodProxiesPath) {
        if (options.deleteFileIfExist)
          await this.deleteFileIfExist(options.goodProxiesPath);
        goodProxiesFileStream = fs.createWriteStream(options.goodProxiesPath);
      }
      if (options.badProxiesPath) {
        if (options.deleteFileIfExist)
          await this.deleteFileIfExist(options.badProxiesPath);
        badProxiesFileStream = fs.createWriteStream(options.badProxiesPath);
      }
    }

    await Promise.all(
      this.proxies.map(async (proxy) => {
        await proxy.checkProxy();
        if (proxy.status == "Dead") {
          if (badProxiesFileStream != null) {
            badProxiesFileStream.write(`${proxy.address}:${proxy.port}\r\n`);
          }
          if (options.output) {
            console.log(
              "\x1b[31m",
              `Proxy: ${proxy.address}:${proxy.port} is ${proxy.status}`
            );
          }
        } else {
          if (goodProxiesFileStream != null) {
            var text = `${proxy.address}:${proxy.port}`;
            if (options.showAnonymous) {
              text += `:${proxy.anonymous}`;
            }
            if (options.showCountry) {
              text += `:${proxy.country}`;
            }
            text += "\r\n";
            goodProxiesFileStream.write(text);
          }
          if (options.output) {
            console.log(
              "\x1b[32m",
              `Proxy: ${proxy.address}:${proxy.port} is ${proxy.status} - Anonymous level: ${proxy.anonymous} - Country: ${proxy.country}`
            );
          }
        }
      })
    );

    if (goodProxiesFileStream != null) {
      goodProxiesFileStream.close();
    }

    if (badProxiesFileStream != null) {
      badProxiesFileStream.close();
    }
  }

  deleteFileIfExist(path) {
    return new Promise((resolve, reject) => {
      fs.exists(path, (exist) => {
        if (exist) {
          fs.unlink(path, (err) => {
            if (err) return reject(err);
            resolve();
          });
        }
      });
    });
  }


  getMyIP() {
    try {
      let sendRequest = await axios({
        method: 'get',
        url: 'http://checkip.dyndns.org/',
      });
      var r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
      this.myIP = sendRequest.data.match(r)[0];
      return this.myIP;
    } catch (error) {
      throw error
    }
  }
}

module.exports = new ProxyChecker();
