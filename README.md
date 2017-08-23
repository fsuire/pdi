## pdi-js

A simple "promiseful" node.js DI:
1. Write services as factory functions, one service per file
2. Create a pdi-js instance by specifying the directory where your services are.
3. Use the pdi-js to get a service instance (the result of a factory function) by specifying the path of your service (where the root implicitely is the directory we talked about previously)
4. A pdi-js instance can be created with a "suffix" : only files with this suffix will be considered as service factory
5. Once a pdi-js instance is created, anything can be added to it and later be retrieved as a service


### Installation

```
$ npm install pdi-js --save
```


### Use without suffix

When the service files are located in a dedicated directory, it's convenient to use pdi-js without suffix:

```js
const PDI = require('pdi-js');

/////////////////////
// create a new di //
/////////////////////

// the argument used for construction points to your service directory
const myServiceDirectory = __dirname + '/services';
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


### Use with a suffix

When the service files are mixed up with other files, just use a suffix, pdi-js will ignore all unsuffixed files.

```js
const PDI = require('pdi-js');

/////////////////////
// create a new di //
/////////////////////

// Let's say your services are mixed up with other files.
// You have to construct a pdi-js instance pointing to your souce directory.
const mySourceDirectory = __dirname;
// Now, we choose a suffix for our service files
const mySuffix = '.srv';
var pdi = new PDI(mySourceDirectory, mySuffix);

///////////////////////////////
// get a service from a file //
///////////////////////////////

// will use the service file {your source directory}/bar.srv.js
pdi.get('bar').then(bar => {
  // bar is the result of the service factory described in {your source directory}/bar.srv.js
});

// will use the service file {your source directory}/foo/bar.srv.js
pdi.get('foo/bar').then(bar => {
  // bar is the result of the service factory described in {your source directory}/foo/bar.srv.js
});

// will use the files {your source directory}/bar.srv.js and {your source directory}/foo/bar.srv.js
pdi.get(['bar', 'foo/bar']).then([bar, fooBar] => {
  // bar is the result of the service factory described in {your source directory}/bar.srv.js
  // fooBar is the result of the service factory described in {your source directory}/foo/bar.srv.js
});

// will use the files {your source directory}/bar.srv.js and {your source directory}/foo/bar.srv.js
pdi.get({
  bar: 'bar',
  fooBar: 'foo/bar'
}).then({bar, fooBar} => {
  // bar is the result of the service factory described in {your source directory}/bar.srv.js
  // fooBar is the result of the service factory described in {your source directory}/foo/bar.srv.js
});
```


### Statically store a pdi-js instance

A PDI instance can also be "stored" then be used "statically":
```js
const PDI = require('pdi-js');
const pdi = new PDI(`${__dirname}service/directory`);
PDI.setStaticDi(pdi);

// Later, in some other file...
const PDI = require('pdi-js');
PDI.get('bar').then(bar => {});

PDI.clear(); // the PDI instance is not stored anymore (useful for unit testing)
```


### Service files are factory function

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


### Use a composition

A composition is just a plain old javascript object describing a list of dependency free services.
It's usefull when we want to initialize several services that will be later used as dependecies.
A composition is usually used at the initialization time of an application, and get busy with stuff like
db configuration/connection.

```js
const composition = {
  dbConnection: new Promise((resolve) => {
    const dbConnection = // do stuff here to get a db connection
    resolve(dbConnection);
  }),
  iceCreamFactory: (flavour) => ({ flavour })
};
pdi.executeComposition(composition)
  .then(() => {
    // ...
  });

// Now, the services "dbConnection" and "iceCreamFactory" can be used as dependencies or retrived by inversion of control
pdi.get(['dbConnection', 'iceCreamFactory'])
  .then(([dbConnection, iceCreamFactory]) => {
    const myIceCream = iceCreamFactory('strawberry');
    return dbConnection.executeRequest(/* whatever is needed to save myIceCream into that db */);
  });
```
