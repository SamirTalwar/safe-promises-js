"use strict";

let expect = require('chai').expect;

let safePromises = require('../lib/safe-promises');

describe('SafePromise', () => {
    it('evaluates just like a regular promise', (done) => {
        let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
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
        let SafePromise = safePromises.timeOutAfter(1000).failWith(actualError => {
            expect(actualError).to.equal(expectedError);
            done();
        });

        SafePromise.reject(expectedError)
            .then(expectARejection(done))
            .perform();
    });

    it('does not worry about caught rejections', (done) => {
        let expectedError = new Error('I am so broken.');
        let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
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
        let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
        SafePromise.resolve(99)
            .then(() => { throw expectedError; })
            .then(expectARejection(done))
            .catch(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            })
            .perform();
    });

    it('returns the Promise value on performing for further chaining', (done) => {
        let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
        SafePromise.resolve(12)
            .perform()
            .then(value => {
                expect(value).to.equal(12);
                done();
            })
            .catch(done);
    });

    it('chains with normal Promises as well as SafePromises', (done) => {
        let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
        new SafePromise((resolve, reject) => resolve(42))
            .then(value => Promise.resolve(value * 2))
            .then(value => SafePromise.resolve(value + 16))
            .then(value => {
                expect(value).to.equal(100);
                done();
            })
            .perform();
    });

    describe('construction as with `new Promise`', () => {
        it('resolves', (done) => {
            let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
            new SafePromise((resolve, reject) => resolve(42))
                .then(value => {
                    expect(value).to.equal(42);
                    done();
                })
                .perform();
        });

        it('rejects', (done) => {
            let expectedError = new Error('Oh no!');
            let SafePromise = safePromises.timeOutAfter(1000).failWith(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            });

            new SafePromise((resolve, reject) => reject(expectedError))
                .then(expectARejection(done))
                .perform();
        });
    });

    describe('.all', () => {
        it('resolves when all promises have been resolved',(done) => {
            let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
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
            let SafePromise = safePromises.timeOutAfter(1000).failWith(actualError => {
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

    describe('.race', () => {
        it('resolves as soon as the first Promise resolves', (done) => {
            let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
            SafePromise.race([
                new Promise(delayedResolutionOf(10, 0)),
                new SafePromise(delayedResolutionOf(20, 1000))
            ]).then(value => {
                expect(value).to.equal(10);
                done();
            })
            .perform();
        });

        it('resolves as soon as the first SafePromise resolves', (done) => {
            let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
            SafePromise.race([
                new Promise(delayedResolutionOf(10, 1000)),
                new SafePromise(delayedResolutionOf(20, 0))
            ])
                .then(value => {
                    expect(value).to.equal(20);
                    done();
                })
                .perform();
        });

        it('rejects as soon as the first Promise rejects', (done) => {
            let expectedError = new Error('You lost.');
            let SafePromise = safePromises.timeOutAfter(1000).failWith(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            });

            SafePromise.race([
                new Promise(delayedRejectionOf(expectedError, 0)),
                new SafePromise(delayedResolutionOf(20, 1000))
            ])
                .then(expectARejection(done))
                .perform();
        });

        it('rejects as soon as the first SafePromise rejects', (done) => {
            let expectedError = new Error('You lost.');
            let SafePromise = safePromises.timeOutAfter(1000).failWith(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            });

            SafePromise.race([
                new Promise(delayedResolutionOf(10, 1000)),
                new SafePromise(delayedRejectionOf(expectedError, 0))
            ])
                .then(expectARejection(done))
                .perform();
        });
    });

    describe('timing out', () => {
        it('times out if the constructor takes too long', (done) => {
            let SafePromise = safePromises.timeOutAfter(100).failWith(actualError => {
                expect(actualError.message).to.equal('Timed out after 100 milliseconds.');
                done();
            });

            new SafePromise((resolve, reject) => {
                setTimeout(resolve, 200, 'Yup.');
            })
                .perform();
        });
    });

    function delayedResolutionOf(value, delay) {
        return (resolve, reject) => {
            setTimeout(resolve, delay || 1, value);
        };
    }

    function delayedRejectionOf(error, delay) {
        return (resolve, reject) => {
            setTimeout(reject, delay || 1, error);
        };
    }

    function expectARejection(done) {
        return value => {
            done(new Error(`Expected a rejected promise, but got ${value}.`));
        };
    }
});
