
jest.mock('./require');
const reqMock = require('./require');

const Pdi = require('./Pdi');

describe('Pdi', () => {

  let pdi;

  beforeEach(() => {
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
  });

  describe('several instances at once', () => {
    const helloFactoryMock = jest.fn((...dependencies) => Promise.resolve('Hello'));
    const worldFactoryMock = jest.fn((...dependencies) => 'World');

    beforeEach(() => {
      reqMock.mockImplementation(() => {
        const lastCallArgs = reqMock.mock.calls[reqMock.mock.calls.length - 1];
        if (lastCallArgs[0] === 'serviceRoot/hello') {
          return helloFactoryMock;
        } else if (lastCallArgs[0] === 'serviceRoot/other/world') {
          return worldFactoryMock;
        }
      });
    });

    it('should get several services instance from an array', () => {
      return pdi.get(['hello', 'other/world']).then(([hello, world]) => {
        expect(hello).toBe('Hello');
        expect(world).toBe('World');
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

});
