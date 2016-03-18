"use strict";

const safePromises = require('safe-promises');
const expect = require('chai').expect;

let SafePromise = safePromises.failWith((error) => {
    console.error(error);
    console.error('Test failed.');
    process.exit(1);
});

SafePromise.reject(new Error('Nope.'))
    .catch(() => 99)
    .then(value => value + 1)
    .then(value => expect(value).to.equal(100))
    .then(() => console.log('Test succeeded.'))
    .perform();
