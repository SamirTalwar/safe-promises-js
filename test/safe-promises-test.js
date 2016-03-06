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
});
