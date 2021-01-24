'use strict';

// https://github.com/Sxxov/eslint-svelte3-preprocess

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var worker_threads = require('worker_threads');
var compiler = require('svelte/compiler');
var esTree = _interopDefault(require('@typescript-eslint/typescript-estree'));
var autoProcess = require('svelte-preprocess/dist/autoProcess');
var url = require('url');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

let lastResult;

if (worker_threads.isMainThread) {
  module.exports = main();
} else {
  worker();
}

function main() {
  // Declaring everything here instead of inside the anon function (`(autoPreprocessConfig) => ...`)
  // gives a huge perf boost for some reason
  // if declared inside, there seems to be a bottleneck messaging the worker, taking up ~300ms
  // this is the same bottleneck of starting a new worker every call
  // without it, it takes mere milliseconds to preprocess everything
  const isDoneBuffer = new SharedArrayBuffer(4);
  const isDoneView = new Int32Array(isDoneBuffer);
  const dataBuffer = new SharedArrayBuffer(50 * 1024 * 1024);
  const dataView = new Uint8Array(dataBuffer);
  const dataLengthBuffer = new SharedArrayBuffer(4);
  const dataLengthView = new Uint32Array(dataLengthBuffer);
  const isRunningOnce = !process.argv.includes("--node-ipc");
  let currentFileLocation = "";

  try {
    var _import$meta;

    currentFileLocation = __filename; // `import.meta.url` is needed for esm interop
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore

    currentFileLocation = url.fileURLToPath((_import$meta = ({ url: (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href)) })) === null || _import$meta === void 0 ? void 0 : _import$meta.url);
  } catch (_) {//
  }

  let worker = getNewWorker();
  return autoPreprocessConfig => (src, filename) => {
    let result; // In case the worker is killed
    // eg. somehow using ESLint async-ly and running this function again,
    // after finishing the event loop once.
    // finishing an event loop would've triggered the killing of the worker

    if (worker === undefined) {
      worker = getNewWorker();
    }

    // console.log("Main:", "Sending request to worker");
    worker.postMessage({
      src,
      filename,
      autoPreprocessConfig
    });
    // console.log("Main:", "Locking thread to wait for response from worker");
    const waitResult = Atomics.wait(isDoneView, 0, 0, 5000);
    // console.log("Main:", `Worker wait result: ${waitResult}`);
    Atomics.store(isDoneView, 0, 0);
    const textDecoder = new TextDecoder();
    const decoded = textDecoder.decode(dataView.subarray(0, dataLengthView[0]));

    try {
      result = JSON.parse(decoded); // It is possible for JSON.parse to return "undefined", eg. in SyntaxErrors
      // so catch that and return a cached result instead of letting ESLint panic

      if (!result) {
        throw new Error(`Result is invalid (${String(result)})`);
      }
    } catch (err) {
      // console.log("Main:", `Parsing JSON returned an error, returning \`lastResult\``);
      // console.log(err);
      return lastResult;
    }

    // console.log("Main:", "Result is valid, returning `result`");

    if (isRunningOnce) {
      // Kill worker on next tick if running in CLI
      // prevents it from locking up and lets it exit when the event loop is finished
      setTimeout(async () => {
        var _worker;

        await ((_worker = worker) === null || _worker === void 0 ? void 0 : _worker.terminate());
        worker = undefined;
      }, 0);
    }

    lastResult = result;
    return result;
  };

  function getNewWorker() {
    return new worker_threads.Worker(currentFileLocation, {
      workerData: [isDoneView, dataView, dataLengthView, isRunningOnce]
    });
  }
}

function worker() {
  if (worker_threads.parentPort === null) {
    throw new Error("parentPort is null");
  }

  let result;
  worker_threads.parentPort.on("message", async message => {
    // console.log("Worker: Message:", "Received preprocessors");

    try {
      result = await preprocess(message);
      // console.log("Worker: Message: Success!");
    } catch (err) {
      // console.log("Worker: Message: Error:", err);
      result = undefined;
    }

    // console.log("Worker: Message:", "Writing preprocess result");
    const [isDoneView, dataView, dataLengthView] = worker_threads.workerData;
    const textEncoder = new TextEncoder();
    const encodedResult = textEncoder.encode(result === undefined ? "" : JSON.stringify(result));
    dataView.set(encodedResult, 0);
    dataLengthView[0] = encodedResult.length;
    // console.log("Worker: Message:", "Unlocking main thread");
    Atomics.store(isDoneView, 0, 1);
    Atomics.notify(isDoneView, 0, Number(Infinity));
  });

  async function preprocess({
    src,
    filename,
    autoPreprocessConfig
  }) {
    let markup;
    let module;
    let instance;
    let style;
    // console.log("Worker: Preprocess:", "Starting preprocess");
    const result = await compiler.preprocess(src, [{
      markup: ({
        content
      }) => {
        markup = {
          original: content
        };
        return {
          code: content
        };
      },
      script: ({
        content,
        attributes
      }) => {
        // Supported scenarios
        // type="text/typescript"
        // lang="typescript"
        // lang="ts"
        if (attributes.lang === "ts" || attributes.lang === "typescript" || attributes.type === "text/typescript") {
          const ast = esTree.parse(content, {
            loc: true
          });
          const obj = {
            ast,
            original: content,
            ext: "ts"
          };

          if (attributes.context) {
            module = obj;
          } else {
            instance = obj;
          }
        }

        return {
          code: content
        };
      },
      style: ({
        content
      }) => {
        style = {
          original: content
        };
        return {
          code: content
        };
      }
    }, autoProcess.sveltePreprocess(autoPreprocessConfig), {
      markup: ({
        content
      }) => {
        if (markup) {
          markup.result = content;
          markup.diff = markup.original.length - content.length;
        }

        return {
          code: content
        };
      },
      script: ({
        content,
        attributes
      }) => {
        const obj = attributes.context ? module : instance;

        if (obj) {
          obj.result = content;
          obj.diff = obj.original.length - content.length;
        }

        return {
          code: content
        };
      },
      style: ({
        content
      }) => {
        if (style) {
          style.result = content;
          style.diff = style.original.length - content.length;
        }

        return {
          code: content
        };
      }
    }], {
      filename: filename || "unknown"
    });
    // console.log("Worker: Preprocess:", "Gotten result from `svelteCompilerPreprocess`");
    return _objectSpread2(_objectSpread2({}, result), {}, {
      instance: instance,
      markup: markup,
      module: module,
      style: style
    });
  }
}

var index = module.exports;

exports.default = index;
//# sourceMappingURL=index.js.map
