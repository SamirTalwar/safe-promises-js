[![Build Status](https://travis-ci.org/SamirTalwar/safe-promises-js.svg?branch=master)](https://travis-ci.org/SamirTalwar/safe-promises-js)
[![npm version](https://badge.fury.io/js/safe-promises.svg)](https://badge.fury.io/js/safe-promises)

# Safe Promises in JavaScript

Promises go wrong too often.

  * It's too easy to forget to catch a promise.
  * Sometimes promises just stop in their tracks.

`SafePromise` doesn't let you forget, and makes sure to time out with an error.

## Installation

Just run:

    $ npm install --save safe-promises

## Examples

By splitting the construction of the promise pipeline from the execution, we can ensure that we always pass in a final `catch` handler. It looks something like this:

```javascript
let safePromises = require('safe-promises');

let SafePromise = safePromises.timeOutAfter(1000).failWith(console.error);

new SafePromise((resolve, reject) => resolve(5))
    .then((value) => {
        if (value % 2 == 1) {
            throw new Error('No odd numbers allowed.');
        }
        return value;
    })
    .perform();
```

That will fail, and even though we haven't provided an explicit `catch` for the promise, we've constructed it with a failure handler that logs to `console.error`, so we know we'll never have to worry about it.

If you need different sorts of error handlers, just construct different `SafePromise` classes. Here, we're setting a timeout of 5 seconds, after which the default timeout error will be passed to the error handler instead.

```javascript
let UIPromise = safePromises.timeOutAfter(5000).failWith((error) => {
    $('#error').text(error.message).show();
});

UIPromise.resolve(user.name)
    .then(lookupUser)
    .perform();
```
