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
            return new SafePromiseBuilder(() => this.buildPromise().then(onResolve));
        }

        catch(onReject) {
            return new SafePromiseBuilder(() => this.buildPromise().catch(onReject));
        }

        perform() {
            this.buildPromise().catch(onFailure);
        }
    };

    return SafePromise;
}

module.exports = {
    failWith
};
