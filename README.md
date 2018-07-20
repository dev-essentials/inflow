# inflow
> Efficiently process text streams line-by-line

Inflow supports:
- All character sets supported by node
- Fast and efficient processing and buffering in the background
- Blocking, non-blocking and asynchronous access

## Installation

`npm i --save @dev-essentials/inflow`

## Usage

Asynchronous access (async/await):
```js
const Influx = require('influx');
const stream = Influx.stdin();

let line;
while (line = await stream.nextAsync()) {
    console.log(line);
}
```

Asynchronous access (without async/await):
```js
const Influx = require('influx');
const stream = Influx.stdin();

const handler = line => {
    if (!line) return;
    console.log(line);
    stream.nextAsync().then(handler);
}

stream.nextAsync().then(handler);
```

Asynchronous access (callback):
```js
const Influx = require('influx');
const stream = Influx.stdin({
    callback: line => {
        console.log(line);
    },
});
```