"use strict";

let expect = require('chai').expect;

let SafePromise = require('../lib/safe-promise');

describe('SafePromise', () => {
    it('evaluates just like a regular promise', (done) => {
        let promise = SafePromise.failWith(done);
        promise.resolve(7)
            .then(value => value + 1)
            .then(value => {
                expect(value).to.equal(8);
                done();
            })
            .perform();
    });

    it('passes rejected promises to the failure handler', (done) => {
        let expectedError = new Error('I am not good.');
        let promise = SafePromise.failWith(actualError => {
            expect(actualError).to.equal(expectedError);
            done();
        });
        promise.reject(expectedError)
            .then(expectARejection(done))
            .perform();
    });

    it('does not worry about caught rejections', (done) => {
        let expectedError = new Error('I am so broken.');
        let promise = SafePromise.failWith(done);
        promise.reject(expectedError)
            .then(expectARejection(done))
            .catch(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            })
            .perform();
    });

    it('handles thrown exceptions as expected', (done) => {
        let expectedError = new Error('Whoops.');
        let promise = SafePromise.failWith(done);
        promise.resolve(99)
            .then(() => { throw expectedError; })
            .then(expectARejection(done))
            .catch(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            })
            .perform();
    });

    it('can be constructed as with `new Promise`', (done) => {
        let promise = SafePromise.failWith(done);
        promise.new((resolve, reject) => resolve(42))
            .then(value => {
                expect(value).to.equal(42);
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
