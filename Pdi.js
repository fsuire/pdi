'use strict';

const req = require('./require');

class Pdi {

  constructor(rootPath) {
    this._rootPath = rootPath;
    this._cache = {};
  }

  get(what, options) {
    if(Array.isArray(what)) {
      return Promise.all(what.map(serviceName => {
        return this._getOneService(serviceName, options);
      }));
    } else if(typeof what === 'object') {
      return Promise.all(
        Object.keys(what).map(serviceName => {
          return this._getOneService(what[serviceName], options);
        })
      ).then(instances => {
        return Object.keys(what)
          .reduce((acc, value, index) => {;
            acc[value] = instances[index];
            return acc;
          }, {});
      });
    } else {
      return this._getOneService(what, options);
    }
  }

  _getOneService(what, options) {
    return new Promise((resolve, reject) => {
      const cachedServiceInstance = this._getInCache(what);
      if(cachedServiceInstance) {
        resolve(cachedServiceInstance);
      } else {
        this._createService(what, resolve, reject);
      }
    });
  }

  _getInCache(what) {
    if(typeof this._cache[what] !== 'undefined') {
      return this._cache[what];
    }
    return undefined;
  }

  _createService(what, resolve, reject) {
    const serviceFactory = req(`${this._rootPath}/${what}`);
    const service = serviceFactory();
    const passToCache = serviceInstance => {
      if(serviceFactory.cache) {
        this._cache[what] = serviceInstance;
      }
    };

    if(service instanceof Promise) {
      service.then(serviceInstance => {
        passToCache(serviceInstance);
        resolve(serviceInstance);
      }).catch(err => {
        reject(err);
      });
    } else {
      passToCache(service);
      resolve(service);
    }
  }

}

module.exports = Pdi;
