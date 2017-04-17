## pdi-js

A simple "promiseful" node.js DI

### Installation

```
$ npm install pdi-js
```

### Exemple

```js
const PDI = require('pdi-js');

/////////////////////
// create a new di //
/////////////////////

// the argument used for construction points to your service directory
var myServiceDirectory = __dirname + '/services';
var pdi = new PDI(myServiceDirectory);

///////////////////////////////
// get a service from a file //
///////////////////////////////

// will use the service file {your service directory}/bar.js
pdi.get('bar').then(bar => {
  // bar is the result of the service factory described in {your service directory}/bar.js
});

// will use the service file {your service directory}/foo/bar.js
pdi.get('foo/bar').then(bar => {
  // bar is the result of the service factory described in {your service directory}/foo/bar.js
});

// will use the files {your service directory}/bar.js and {your service directory}/foo/bar.js
pdi.get(['bar', 'foo/bar']).then([bar, fooBar] => {
  // bar is the result of the service factory described in {your service directory}/bar.js
  // fooBar is the result of the service factory described in {your service directory}/foo/bar.js
});

// will use the files {your service directory}/bar.js and {your service directory}/foo/bar.js
pdi.get({
  bar: 'bar',
  fooBar: 'foo/bar'
}).then({bar, fooBar} => {
  // bar is the result of the service factory described in {your service directory}/bar.js
  // fooBar is the result of the service factory described in {your service directory}/foo/bar.js
});
```

A PDI instance can also be "stored" then be used "statically":
```js
PDI.setStaticDi(pdi);
PDI.get('bar').then(bar => {});

PDI.clear(); // the PDI instance is not stored anymore (useful for unit testing)
```

The services are node.js modules that simply returns a factory function :

```js
// {your service directory}/random.js
const random = () => {
  return Math.floor(Math.random() * 1000);
};
module.exports = random
```

```js
// {your service directory}/foo.js
const foo = () => {
  return 'foo';
};
foo.cache = true; // the result of this service factory function will be cached by PDI
module.exports = foo
```

Other services can be used as dependencies for your factory function:
```js
// {your service directory}/baz.js
const bar = ([foo, fooBar]) => {
  return 'bar';
};
bar.dependencies = ['foo', 'foo/bar'];
module.exports = bar
```
```js
// {your service directory}/baz.js
const bar = ({foo, fooBar}) => {
  return 'bar';
};
bar.dependencies = {
  foo: 'foo',
  fooBar: 'foo/bar'
};
module.exports = bar
```

Eventually, you can directly pass a service instance to the pdi, it will be "stored" as a cached service:
```js
const someService = {name: 'some service'};
pdi.set('some/service', someService);
pdi.get('some/service').then(service => {
  // service === someService
});
```
