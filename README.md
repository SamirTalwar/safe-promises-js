# Safe Promises in JavaScript

It's too easy to forget to catch a promise. `SafePromise` doesn't let you forget.

By splitting the construction of the promise pipeline from the execution, we can ensure that we always pass in a final `catch` handler. It looks something like this:

    let safePromises = require('safe-promises');

    let SafePromise = safePromises.failWith(console.error);

    new SafePromise((resolve, reject) => resolve(5))
        .then((value) => {
            if (value % 2 == 1) {
                throw new Error('No odd numbers allowed.');
            }
            return value;
        })
        .perform();

That will fail, and even though we haven't provided an explicit `catch` for the promise, we've constructed it with a failure handler that logs to `console.error`, so we know we'll never have to worry about it.
