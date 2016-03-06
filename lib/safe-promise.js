"use strict";

class SafePromise {
    constructor(onFailure) {
        this.onFailure = onFailure;
    }

    static failWith(onFailure) {
        return new SafePromise(onFailure);
    }

    resolve(value) {
        return new SafePromiseBuilder(value, this.onFailure);
    }
};

class SafePromiseBuilder {
    constructor(value, onFailure, operations) {
        this.value = value;
        this.onFailure = onFailure;
        this.operations = operations || [];
    }

    then(onResolve) {
        return new SafePromiseBuilder(
            this.value,
            this.onFailure,
            this.operations.concat([
                (promise => promise.then(onResolve))
            ])
        );
    }

    perform() {
        let initialPromise = Promise.resolve(this.value);
        this.operations.reduce((promise, operation) => operation(promise), initialPromise);
    }
};

module.exports = SafePromise;
