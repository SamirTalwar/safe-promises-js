"use strict";

let expect = require('chai').expect;

let SafePromise = require('../lib/safe-promise');

describe('SafePromise', () => {
    it('evaluates just like a regular promise', (done) => {
        let promise = SafePromise.failWith(done);
        promise.resolve(7)
            .then(value => value + 1)
            .then(value => {
                expect(value).to.equal(8);
                done();
            })
            .perform();
    });

    it('passes rejected promises to the failure handler', (done) => {
        let promise = SafePromise.failWith(() => done());
        promise.reject(new Error('I am not good.'))
            .then(expectARejection(done))
            .perform();
    });

    it('does not worry about caught rejections', (done) => {
        let promise = SafePromise.failWith(done);
        promise.reject(new Error('I am so broken.'))
            .then(expectARejection(done))
            .catch(() => {
                done();
            })
            .perform();
    });

    function expectARejection(done) {
        return value => {
            done(new Error(`Expected a rejected promise, but got ${value}.`));
        };
    }
});
