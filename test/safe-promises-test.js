"use strict";

let expect = require('chai').expect;

let safePromises = require('../lib/safe-promises');

describe('a safe promise', () => {
    it('evaluates just like a regular promise', (done) => {
        let SafePromise = safePromises.failWith(done);
        SafePromise.resolve(7)
            .then(value => value + 1)
            .then(value => {
                expect(value).to.equal(8);
                done();
            })
            .perform();
    });

    it('passes rejected promises to the failure handler', (done) => {
        let expectedError = new Error('I am not good.');
        let SafePromise = safePromises.failWith(actualError => {
            expect(actualError).to.equal(expectedError);
            done();
        });
        SafePromise.reject(expectedError)
            .then(expectARejection(done))
            .perform();
    });

    it('does not worry about caught rejections', (done) => {
        let expectedError = new Error('I am so broken.');
        let SafePromise = safePromises.failWith(done);
        SafePromise.reject(expectedError)
            .then(expectARejection(done))
            .catch(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            })
            .perform();
    });

    it('handles thrown exceptions as expected', (done) => {
        let expectedError = new Error('Whoops.');
        let SafePromise = safePromises.failWith(done);
        SafePromise.resolve(99)
            .then(() => { throw expectedError; })
            .then(expectARejection(done))
            .catch(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            })
            .perform();
    });

    it('can be constructed as with `new Promise`', (done) => {
        let SafePromise = safePromises.failWith(done);
        new SafePromise((resolve, reject) => resolve(42))
            .then(value => {
                expect(value).to.equal(42);
                done();
            })
            .perform();
    });

    it('returns the Promise value on performing for further chaining', (done) => {
        let SafePromise = safePromises.failWith(done);
        SafePromise.resolve(12)
            .perform()
            .then(value => {
                expect(value).to.equal(12);
                done();
            })
            .catch(done);
    });

    it('chains with normal Promises as well as SafePromises', (done) => {
        let SafePromise = safePromises.failWith(done);
        new SafePromise((resolve, reject) => resolve(42))
            .then(value => Promise.resolve(value * 2))
            .then(value => SafePromise.resolve(value + 16))
            .then(value => {
                expect(value).to.equal(100);
                done();
            })
            .perform();
    });

    function expectARejection(done) {
        return value => {
            done(new Error(`Expected a rejected promise, but got ${value}.`));
        };
    }
});
