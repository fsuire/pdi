
jest.mock('./require');
const reqMock = require('./require');

const Pdi = require('./Pdi');

describe('Pdi', () => {

  let pdi;

  beforeEach(() => {
    Pdi.clear();
    pdi = new Pdi('serviceRoot');
    jest.clearAllMocks();
  });

  describe('instance', () => {
    it('should get a service instance', () => {
      const serviceFactoryMock = jest.fn((...dependencies) => 'test');
      reqMock.mockImplementationOnce(() => serviceFactoryMock);
      return pdi.get('service').then(service => {
        expect(service).toBe('test');
        expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
      });
    });

    it('should get a service instance even if the serviceFactory returns a promise', () => {
      const serviceFactoryMock = jest.fn((...dependencies) => Promise.resolve('test'));
      reqMock.mockImplementationOnce(() => serviceFactoryMock);
      return pdi.get('service').then(service => {
        expect(service).toBe('test');
        expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
      });
    });

    it('should not get a service instance', () => {
      reqMock.mockImplementationOnce(() => {throw 'test error';});
      return pdi.get('service').catch(error => {
        expect(error).toBe('test error');
        expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
      });
    });

    it('should not get a service instance if the serviceFactory returns a failing promise', () => {
      const serviceFactoryMock = jest.fn((...dependencies) => Promise.reject('test error'));
      reqMock.mockImplementationOnce(() => serviceFactoryMock);
      return pdi.get('service').catch(error => {
        expect(error).toBe('test error');
        expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
      });
    });

    it('should store a service directly', () => {
      pdi.set('test/service', 'test service instance');
      return pdi.get('test/service').then(service => {
        expect(service).toEqual('test service instance');
      })
    });

    it('should not replace an already cached service', () => {
      pdi.set('test/service', 'test service instance');
      pdi.set('test/service', 'test another service instance');
      return pdi.get('test/service').then(service => {
        expect(service).toEqual('test service instance');
        expect(service).not.toEqual('test another service instance');
      })
    });

    it('should replace an already cached service', () => {
      pdi.set('test/service', 'test service instance');
      pdi.set('test/service', 'test another service instance', true);
      return pdi.get('test/service').then(service => {
        expect(service).toEqual('test another service instance');
        expect(service).not.toEqual('test service instance');
      })
    });
  });

  describe('several instances at once', () => {
    const helloFactoryMock = jest.fn((...dependencies) => Promise.resolve('Hello'));
    const worldFactoryMock = jest.fn((...dependencies) => 'World');
    const errorFactoryMock = jest.fn((...dependencies) => Promise.reject('test error'));

    beforeEach(() => {
      reqMock.mockImplementation(() => {
        const lastCallArgs = reqMock.mock.calls[reqMock.mock.calls.length - 1];
        if (lastCallArgs[0] === 'serviceRoot/hello') {
          return helloFactoryMock;
        } else if (lastCallArgs[0] === 'serviceRoot/other/world') {
          return worldFactoryMock;
        } else {
          return errorFactoryMock;
        }
      });
    });

    it('should get several services instance from an array', () => {
      return pdi.get(['hello', 'other/world']).then(([hello, world]) => {
        expect(hello).toBe('Hello');
        expect(world).toBe('World');
      });
    });

    it('should not get several services instance from an array', () => {
      return pdi.get(['hello', 'other/world', 'error']).catch(error => {
        expect(error).toBe('test error');
      });
    });

    it('should get several services instance from an object', () => {
      return pdi.get({
        hello: 'hello',
        world: 'other/world'
      }).then(({hello, world}) => {
        expect(hello).toBe('Hello');
        expect(world).toBe('World');
      });
    });

    it('should not get several services instance from an object', () => {
      return pdi.get({
        hello: 'hello',
        world: 'other/world',
        error: 'error'
      }).catch(error => {
        expect(error).toBe('test error');
      });
    });
  });

  describe('dependencies', () => {
    const errorFactoryMock = jest.fn((...dependencies) => Promise.reject('test error'));
    const helloFactoryMock = jest.fn((...dependencies) => Promise.resolve('Hello'));
    const worldFactoryMock = jest.fn((...dependencies) => 'World');
    const helloWorldFactoryMock = jest.fn(({hello, world}) => `${hello} ${world} !`);
    helloWorldFactoryMock.dependencies = {
      hello: 'hello',
      world: 'other/world'
    };
    const helloErrorFactoryMock = jest.fn(({hello, error}) => `${hello} ${error} !`);
    helloErrorFactoryMock.dependencies = {
      hello: 'hello',
      error: 'error'
    };

    beforeEach(() => {
      reqMock.mockImplementation(() => {
        const lastCallArgs = reqMock.mock.calls[reqMock.mock.calls.length - 1];
        if (lastCallArgs[0] === 'serviceRoot/hello') {
          return helloFactoryMock;
        } else if (lastCallArgs[0] === 'serviceRoot/other/world') {
          return worldFactoryMock;
        } else if (lastCallArgs[0] === 'serviceRoot/helloworld') {
          return helloWorldFactoryMock;
        } else if (lastCallArgs[0] === 'serviceRoot/helloerror') {
          return helloErrorFactoryMock;
        } else {
          return errorFactoryMock;
        }
      });
    });

    it('should get a service with dependencies', () => {
      return pdi.get('helloworld').then(service => {
        expect(service).toEqual('Hello World !');
      })
    });

    it('should not get a service with dependencies', () => {
      return pdi.get('helloerror').catch(error => {
        expect(error).toEqual('test error');
      })
    });
  });

  describe('cache', () => {
    const serviceFactoryMock = jest.fn((...dependencies) => Math.floor(Math.random() * 1000));

    it('should get a cached service instance', () => {
      serviceFactoryMock.cache = true;
      reqMock.mockImplementationOnce(() => serviceFactoryMock);
      let firstObtainedInstance;
      return pdi.get('service').then(service => {
        firstObtainedInstance = service;
        expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
        return pdi.get('service');
      }).then(service => {
        expect(service).toEqual(firstObtainedInstance);
      });
    });

    it('should get a not cached service instance', () => {
      serviceFactoryMock.cache = false;
      reqMock.mockImplementationOnce(() => serviceFactoryMock);
      reqMock.mockImplementationOnce(() => serviceFactoryMock);
      let firstObtainedInstance;
      return pdi.get('service').then(service => {
        firstObtainedInstance = service;
        expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
        return pdi.get('service');
      }).then(service => {
        expect(service).not.toEqual(firstObtainedInstance);
      });
    });
  });

  describe('static di', () => {
    it('should throw an error if setStaticDi is called without a Pdi instance', () => {
      expect(() => Pdi.setStaticDi('not a Pdi instance'))
        .toThrow('A Pdi instance is required in order to be set as a static DI');
    });

    it('should not get any service instance from Pdi.get when no Pdi instance has been set as a static DI', () => {
      Pdi.get('service').catch(err => {
        expect(err).toBe('Pdi.get is called while no Pdi instance has been set as a static DI');
      });
    });

    it('should create and use a static di', () => {
      const serviceFactoryMock = jest.fn((...dependencies) => 'test');
      reqMock.mockImplementationOnce(() => serviceFactoryMock);
      Pdi.setStaticDi(pdi);
      return Pdi.get('service').then(service => {
        expect(service).toBe('test');
        expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
      });
    });

    it('should set a service instance on the static di', () => {
      Pdi.setStaticDi(pdi);
      Pdi.set('service', 'test service');
      Pdi.get('service').then(service => {
        expect(service).toEqual('test service');
      });
    });

    it('should set a service instance on the static di', () => {
      expect(() => Pdi.set('test/service', 'test service'))
        .toThrow('No PDI instance has been set for a static usage, the service "test/service" cannot be created');
    });
  });
});
