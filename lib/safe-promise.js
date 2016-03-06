"use strict";

class SafePromise {
    constructor(onFailure) {
        this.onFailure = onFailure;
    }

    static failWith(onFailure) {
        return new SafePromise(onFailure);
    }

    new(executor) {
        return new SafePromiseBuilder(executor, this.onFailure);
    }

    resolve(value) {
        let executor = (resolve, reject) => resolve(value);
        return new SafePromiseBuilder(executor, this.onFailure);
    }

    reject(error) {
        let executor = (resolve, reject) => reject(error);
        return new SafePromiseBuilder(executor, this.onFailure);
    }
};

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

module.exports = SafePromise;
