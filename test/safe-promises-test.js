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
        let SafePromise = safePromises.timeOutAfter(1000).failWith(reportErrorsTo(done, actualError => {
            expect(actualError).to.equal(expectedError);
            done();
        }));

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

    it('does as expected when the failure handler fails', (done) => {
        let expectedError = new Error('Handler failure.');
        let SafePromise = safePromises.timeOutAfter(1000).failWith(error => {
            throw expectedError;
        });
        SafePromise.reject(new Error('Nah.'))
            .then(expectARejection(done))
            .perform()
            .catch(actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            });
    });

    it('chains with normal Promises as well as SafePromises', (done) => {
        let SafePromise = safePromises.timeOutAfter(1000).failWith(done);
        new SafePromise((resolve, reject) => resolve(42))
            .then(value => Promise.resolve(value * 2))
            .then(value => SafePromise.resolve(value + 16))
            .then(value => new Promise((resolve, reject) => {
                resolve(value + 50);
            }))
            .then(value => new SafePromise((resolve, reject) => {
                resolve(value * 2);
            }))
            .then(value => {
                expect(value).to.equal(300);
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
            let SafePromise = safePromises.timeOutAfter(1000).failWith(reportErrorsTo(done, actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            }));

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
            let SafePromise = safePromises.timeOutAfter(1000).failWith(reportErrorsTo(done, actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            }));

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
            let SafePromise = safePromises.timeOutAfter(1000).failWith(reportErrorsTo(done, actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            }));

            SafePromise.race([
                new Promise(delayedRejectionOf(expectedError, 0)),
                new SafePromise(delayedResolutionOf(20, 1000))
            ])
                .then(expectARejection(done))
                .perform();
        });

        it('rejects as soon as the first SafePromise rejects', (done) => {
            let expectedError = new Error('You lost.');
            let SafePromise = safePromises.timeOutAfter(1000).failWith(reportErrorsTo(done, actualError => {
                expect(actualError).to.equal(expectedError);
                done();
            }));

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
            let SafePromise = safePromises.timeOutAfter(100).failWith(reportErrorsTo(done, actualError => {
                expect(actualError.message).to.equal('Timed out after 100 milliseconds.');
                done();
            }));

            new SafePromise(delayedResolutionOf('Yup.', 200))
                .perform();
        });

        it('times out if `then` takes too long', (done) => {
            let SafePromise = safePromises.timeOutAfter(50).failWith(reportErrorsTo(done, actualError => {
                expect(actualError.message).to.equal('Timed out after 50 milliseconds.');
                done();
            }));

            SafePromise.resolve(10)
                .then(value => new Promise(delayedResolutionOf(20, 100)))
                .perform();
        });

        it('times out if `catch` takes too long', (done) => {
            let SafePromise = safePromises.timeOutAfter(20).failWith(reportErrorsTo(done, actualError => {
                expect(actualError.message).to.equal('Timed out after 20 milliseconds.');
                done();
            }));

            SafePromise.reject(new Error('Hi!'))
                .catch(error => new Promise(delayedResolutionOf('Hi right back!', 50)))
                .perform();
        });

        it('times out if the entire series of operations takes too long', (done) => {
            let SafePromise = safePromises.timeOutAfter(100).failWith(reportErrorsTo(done, actualError => {
                expect(actualError.message).to.equal('Timed out after 100 milliseconds.');
                done();
            }));

            SafePromise.resolve(0)
                .then(i => new Promise(delayedRejectionOf(i + 1, 10)))
                .catch(i => new Promise(delayedResolutionOf(i + 1, 10)))
                .then(i => new Promise(delayedRejectionOf(i + 1, 10)))
                .catch(i => new Promise(delayedResolutionOf(i + 1, 10)))
                .then(i => new Promise(delayedRejectionOf(i + 1, 10)))
                .catch(i => new Promise(delayedResolutionOf(i + 1, 10)))
                .then(i => new Promise(delayedRejectionOf(i + 1, 10)))
                .catch(i => new Promise(delayedResolutionOf(i + 1, 10)))
                .then(i => new Promise(delayedRejectionOf(i + 1, 10)))
                .catch(i => new Promise(delayedResolutionOf(i + 1, 10)))
                .then(i => new Promise(delayedRejectionOf(i + 1, 10)))
                .catch(i => new Promise(delayedResolutionOf(i + 1, 10)))
                .perform();
        });

        it('allows for SafePromises in the timeout calculation', (done) => {
            let SafePromise = safePromises.timeOutAfter(20).failWith(actualError => {
                expect(actualError.message).to.equal('Timed out after 20 milliseconds.');
                done();
            });

            SafePromise.resolve(0)
                .then(i => new SafePromise(delayedRejectionOf(i + 1, 10)))
                .catch(i => new SafePromise(delayedResolutionOf(i + 1, 10)))
                .then(i => new SafePromise(delayedRejectionOf(i + 1, 10)))
                .catch(i => new SafePromise(delayedResolutionOf(i + 1, 10)))
                .perform();
        });

        it('is fulfilled with the result of the error handler on timeout', (done) => {
            let subsequentError = new Error('And fail some more.');
            let SafePromise = safePromises.timeOutAfter(20).failWith(actualError => {
                expect(actualError.message).to.equal('Timed out after 20 milliseconds.');
                return new Promise((resolve, reject) => setTimeout(reject, 100, subsequentError));
            });

            new SafePromise(delayedResolutionOf('Yello.', 50))
                .perform()
                .then(value => done(new Error(`Expected the promise to time out, but got ${JSON.stringify(value)}.`)))
                .catch(actualError => {
                    expect(actualError).to.equal(subsequentError);
                    done();
                });
        });

        it('allows for a custom timeout error object', (done) => {
            let SafePromise = safePromises
                .timeOutAfter(50, (timeout) => new Error(`You win ${timeout} points!`))
                .failWith(reportErrorsTo(done, actualError => {
                    expect(actualError.message).to.equal('You win 50 points!');
                    done();
                }));

            new SafePromise(delayedResolutionOf('Meh.', 100))
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
            done(new Error(`Expected a rejected promise, but got ${JSON.stringify(value)}.`));
        };
    }

    function reportErrorsTo(done, failureHandler) {
        return (error) => {
            try {
                failureHandler(error);
            } catch (handlerError) {
                done(handlerError);
            }
        };
    }
});
