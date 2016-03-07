"use strict";

function failWith(onFailure) {
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
    }

    class SafePromiseBuilder {
        constructor(buildPromise) {
            this.buildPromise = buildPromise;
        }

        then(onResolve) {
            return new SafePromiseBuilder(() => this.buildPromise().then(performSafePromise(onResolve)));
        }

        catch(onReject) {
            return new SafePromiseBuilder(() => this.buildPromise().catch(performSafePromise(onReject)));
        }

        perform() {
            return this.buildPromise().catch(onFailure);
        }

        __isASafePromise() { }
    };

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

    return SafePromise;
}

module.exports = {
    failWith
};
