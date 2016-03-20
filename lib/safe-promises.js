"use strict";

function timeOutAfter(timeout) {
    return {
        failWith: function(onFailure) {
            return safePromiseClass(timeout, onFailure);
        }
    };
}

function safePromiseClass(timeout, onFailure) {
    class SafePromise {
        constructor(executor) {
            return new SafePromiseBuilder(() => new Promise(executor));
        }

        static resolve(value) {
            let executor = (resolve, reject) => resolve(value);
            return new SafePromise(executor);
        }

        static reject(error) {
            let executor = (resolve, reject) => reject(error);
            return new SafePromise(executor);
        }

        static all(promises) {
            return new SafePromiseBuilder(() => Promise.all(promises.map(performSafePromiseUnsafely)));
        }

        static race(promises) {
            return new SafePromiseBuilder(() => Promise.race(promises.map(performSafePromiseUnsafely)));
        }
    }

    class SafePromiseBuilder {
        constructor(performUnsafely) {
            this.performUnsafely = performUnsafely;
        }

        then(onResolve) {
            return new SafePromiseBuilder(() => this.performUnsafely().then(performSafePromise(onResolve)));
        }

        catch(onReject) {
            return new SafePromiseBuilder(() => this.performUnsafely().catch(performSafePromise(onReject)));
        }

        perform() {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(timeoutError(timeout));
                }, timeout);
                this.performUnsafely()
                    .then(resolve)
                    .catch(reject);
            })
                .catch(onFailure);
        }

        __isASafePromise() { }
    };

    return SafePromise;
}

function performSafePromise(callback) {
    return function() {
        let value = callback.apply(this, arguments);
        if (value && value.__isASafePromise) {
            return value.perform();
        } else {
            return value;
        }
    };
}

function performSafePromiseUnsafely(promise) {
    if (promise && promise.__isASafePromise) {
        return promise.performUnsafely();
    } else {
        return promise;
    }
}

function timeoutError(timeout) {
    return new Error(`Timed out after ${timeout} milliseconds.`);
}

module.exports = {
    timeOutAfter
};
