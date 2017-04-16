'use strict';

const req = require('./require');
let staticDi;

/**
 *
 */
class Pdi {

  /**
   * @param  {string} rootPath Path to the services directory
   * @example
   * const pdi = new Pdi(`${__dirname}/service-directory`);
   */
  constructor(rootPath) {
    this._rootPath = rootPath;
    this._cache = {};
  }

  /**
   * Get a service instance
   * @param  {string} what The service you want
   * @return {Promise}     A promise that hold the service instance
   * @example
   * // will return the service held by __dirname/service-directory/service.js
   * const pdi = new Pdi(`${__dirname}/service-directory`);
   * pdi.get('service').then(service => <do what you want>);
   * @example
   * // will return the service held by __dirname/service-directory/some-domain/service.js
   * const pdi = new Pdi(`${__dirname}/service-directory`);
   * pdi.get('some-domain/service').then(service => <do what you want>);
   * @example
   * // will return several services at once
   * pdi.get(['some-domain/service', 'service2']).then(([service, service2]) => <do what you want>);
   * @example
   * // will return several services at once
   * pdi.get({
   *   service: 'some-domain/service',
   *   service2: 'service2'
   * }).then(({service, service2}) => <do what you want>);
   */
  get(what) {
    if(Array.isArray(what)) {
      return Promise.all(what.map(serviceName => {
        return this._getOneService(serviceName);
      }));
    } else if(typeof what === 'object') {
      return Promise.all(
        Object.keys(what).map(serviceName => {
          return this._getOneService(what[serviceName]);
        })
      ).then(instances => {
        return Object.keys(what)
          .reduce((acc, value, index) => {;
            acc[value] = instances[index];
            return acc;
          }, {});
      });
    } else {
      return this._getOneService(what);
    }
  }

  /**
   * Set a Pdi instance to be used statically, directly from Pdi
   * @param {Pdi} pdi A Pdi instance
   * @example
   * const pdiInstance = new Pdi(`${__dirname}/service-directory`);
   * Pdi.setStaticDi(pdiInstance);
   * Pdi.get('service').then(serviceInstance => <do what you want>);
   */
  static setStaticDi(pdi) {
    if(pdi instanceof Pdi) {
      staticDi = pdi;
    } else {
      throw new Error('A Pdi instance is required in order to be set as a static DI');
    }
  }

  /**
   * Get a service instance from a pdi previously registered with Pdi.setStaticDi
   * @param  {string} what The service you want
   * @return {Promise}     A promise that hold the service instance
   * @example
   * const pdiInstance = new Pdi(`${__dirname}/service-directory`);
   * Pdi.setStaticDi(pdiInstance);
   * Pdi.get('service').then(serviceInstance => <do what you want>);
   */
  static get(what) {
    if(staticDi instanceof Pdi) {
      return staticDi.get(what);
    } else {
      return Promise.reject('Pdi.get is called while no Pdi instance has been set as a static DI');
    }
  }

  /**
   * get only one service
   * @private
   * @param  {string} what The service you want
   * @return {Promise}     A promise that hold the service instance
   */
  _getOneService(what) {
    return new Promise((resolve, reject) => {
      const cachedServiceInstance = this._getInCache(what);
      if(cachedServiceInstance) {
        resolve(cachedServiceInstance);
      } else {
        this._createService(what, resolve, reject);
      }
    });
  }

  /**
   * check if there is a cached instance of a service
   * @private
   * @param  {string} what    The required service
   * @return {any|undefined}  The cached service instance
   */
  _getInCache(what) {
    if(typeof this._cache[what] !== 'undefined') {
      return this._cache[what];
    }
    return undefined;
  }

  /**
   * Will create a service instance, executing the service factory.
   * Will also load dependencies for the required service, and cache the obtained instance if required.
   * @private
   * @param  {string}   what    The required service
   * @param  {function} resolve The resolve function, used for the promise that must have called #_createService
   * @param  {function} reject  The resolve function, used for the promise that must have called #_createService
   */
  _createService(what, resolve, reject) {
    const serviceFactory = req(`${this._rootPath}/${what}`);
    let dependencies = Promise.resolve();

    if(serviceFactory.dependencies) {
      dependencies = this.get(serviceFactory.dependencies)
        .catch(error => {
          reject(error);
        });
    }

    dependencies.then(deps => {
      const service = serviceFactory(deps);
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
    }).catch(err => {
      reject(err);
    });
  }

}

module.exports = Pdi;
