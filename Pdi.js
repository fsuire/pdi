'use strict';

const req = require('./require');

class Pdi {

  constructor(rootPath) {
    this._rootPath = rootPath;
  }

  get(what, options) {
    return new Promise((resolve, reject) => {
      try {
        const rawService = req(`${this._rootPath}/${what}`);
        const service = rawService();
        if(service instanceof Promise) {
          service.then(serviceInstance => {
            resolve(serviceInstance);
          }).catch(err => {
            reject(err);
          });
        } else {
          resolve(service);
        }
      } catch(err) {
        reject(err);
      }
    });
  }

}

module.exports = Pdi;
