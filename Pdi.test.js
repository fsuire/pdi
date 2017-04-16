
jest.mock('./require');
const reqMock = require('./require');

const Pdi = require('./Pdi');

describe('Pdi', () => {

  it('should get a service instance', () => {
    const serviceFactoryMock = jest.fn((...dependencies) => 'test');
    reqMock.mockImplementationOnce(() => serviceFactoryMock);
    const pdi = new Pdi('serviceRoot');
    return pdi.get('service').then(service => {
      expect(service).toBe('test');
      expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
    });
  });

  it('should get a service instance even if the serviceFactory returns a promise', () => {
    const serviceFactoryMock = jest.fn((...dependencies) => Promise.resolve('test'));
    reqMock.mockImplementationOnce(() => serviceFactoryMock);
    const pdi = new Pdi('serviceRoot');
    return pdi.get('service').then(service => {
      expect(service).toBe('test');
      expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
    });
  });

  it('should not get a service instance', () => {
    reqMock.mockImplementationOnce(() => {throw 'test error';});
    const pdi = new Pdi('serviceRoot');
    return pdi.get('service').catch(error => {
      expect(error).toBe('test error');
      expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
    });
  });

  it('should not get a service instance if the serviceFactory returns a failing promise', () => {
    const serviceFactoryMock = jest.fn((...dependencies) => Promise.reject('test error'));
    reqMock.mockImplementationOnce(() => serviceFactoryMock);
    const pdi = new Pdi('serviceRoot');
    return pdi.get('service').catch(error => {
      expect(error).toBe('test error');
      expect(reqMock).toHaveBeenCalledWith('serviceRoot/service');
    });
  });

});
