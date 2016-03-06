"use strict";

class SafePromise {
    constructor(onFailure) {
        this.onFailure = onFailure;
    }

    static failWith(onFailure) {
        return new SafePromise(onFailure);
    }

    resolve(value) {
        return new SafePromiseBuilder(value, null, this.onFailure);
    }

    reject(error) {
        return new SafePromiseBuilder(null, error, this.onFailure);
    }
};

class SafePromiseBuilder {
    constructor(value, error, onFailure, operations) {
        this.value = value;
        this.error = error;
        this.onFailure = onFailure;
        this.operations = operations || [];
    }

    then(onResolve) {
        return new SafePromiseBuilder(
            this.value,
            this.error,
            this.onFailure,
            this.operations.concat([
                (promise => promise.then(onResolve))
            ])
        );
    }

    catch(onReject) {
        return new SafePromiseBuilder(
            this.value,
            this.error,
            this.onFailure,
            this.operations.concat([
                (promise => promise.catch(onReject))
            ])
        );
    }

    perform() {
        let initialPromise = this.error ? Promise.reject(this.error) : Promise.resolve(this.value);
        let operationalPromise = this.operations.reduce((promise, operation) => operation(promise), initialPromise);
        operationalPromise.catch(this.onFailure);
    }
};

module.exports = SafePromise;
