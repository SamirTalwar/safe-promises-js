"use strict";

function failWith(onFailure) {
    return class SafePromise {
        constructor(executor) {
            return new SafePromiseBuilder(executor, onFailure);
        }

        static resolve(value) {
            let executor = (resolve, reject) => resolve(value);
            return new SafePromiseBuilder(executor, onFailure);
        }

        static reject(error) {
            let executor = (resolve, reject) => reject(error);
            return new SafePromiseBuilder(executor, onFailure);
        }
    };
}

class SafePromiseBuilder {
    constructor(executor, onFailure, operations) {
        this.executor = executor;
        this.onFailure = onFailure;
        this.operations = operations || [];
    }

    then(onResolve) {
        return new SafePromiseBuilder(
            this.executor,
            this.onFailure,
            this.operations.concat([
                (promise => promise.then(onResolve))
            ])
        );
    }

    catch(onReject) {
        return new SafePromiseBuilder(
            this.executor,
            this.onFailure,
            this.operations.concat([
                (promise => promise.catch(onReject))
            ])
        );
    }

    perform() {
        let initialPromise = new Promise(this.executor);
        let operationalPromise = this.operations.reduce((promise, operation) => operation(promise), initialPromise);
        operationalPromise.catch(this.onFailure);
    }
};

module.exports = {
    failWith
};
