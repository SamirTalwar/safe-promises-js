"use strict";

let expect = require('chai').expect;

let safePromises = require('../lib/safe-promises');

describe('SafePromise', () => {
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

    describe('.all', () => {
        it('resolves when all promises have been resolved',(done) => {
            let SafePromise = safePromises.failWith(done);
            SafePromise.all([
                1,
                Promise.resolve(2),
                SafePromise.resolve(3),
                new Promise(delayedResolutionOf(4)),
                new SafePromise(delayedResolutionOf(5))
            ])
                .then(array => {
                    expect(array).to.deep.equal([1, 2, 3, 4, 5]);
                    done();
                })
                .perform();
        });

        it('rejects on a single rejection',(done) => {
            let expectedError = new Error('I don\'t think so.');
            let SafePromise = safePromises.failWith(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            });

            SafePromise.all([
                1,
                Promise.resolve(2),
                SafePromise.reject(expectedError),
                new Promise(delayedResolutionOf(4)),
                new SafePromise(delayedResolutionOf(5))
            ])
                .then(expectARejection(done))
                .perform();
        });
    });

    function delayedResolutionOf(value) {
        return (resolve, reject) => {
            setTimeout(() => resolve(value), 1);
        };
    }

    function expectARejection(done) {
        return value => {
            done(new Error(`Expected a rejected promise, but got ${value}.`));
        };
    }
});
