// VoxelScript Interpreter - Executes the AST
// Supports: classes, async/await, try-catch, switch, arrow functions, destructuring, spread, and more

const readline = require('readline');

// Control flow exceptions
class ReturnValue extends Error {
  constructor(value) {
    super();
    this.value = value;
  }
}

class BreakLoop extends Error {}
class ContinueLoop extends Error {}
class ThrowError extends Error {
  constructor(value) {
    super(value?.message || String(value));
    this.thrownValue = value;
  }
}

// VoxelScript Class Instance
class VoxelInstance {
  constructor(klass, properties = {}) {
    this.__class__ = klass;
    this.__properties__ = { ...properties };
  }
  
  get(name) {
    if (name in this.__properties__) {
      return this.__properties__[name];
    }
    // Look up in class methods
    if (this.__class__) {
      const method = this.__class__.__methods__[name];
      if (method) {
        // Bind method to this instance
        return {
          __isVoxelFunction: true,
          params: method.params,
          body: method.body,
          closure: method.closure,
          boundThis: this,
          isAsync: method.isAsync
        };
      }
      // Look up in parent class
      if (this.__class__.__parent__) {
        const parentMethod = this.__class__.__parent__.__methods__[name];
        if (parentMethod) {
          return {
            __isVoxelFunction: true,
            params: parentMethod.params,
            body: parentMethod.body,
            closure: parentMethod.closure,
            boundThis: this,
            isAsync: parentMethod.isAsync
          };
        }
      }
    }
    return undefined;
  }
  
  set(name, value) {
    this.__properties__[name] = value;
  }
}

// VoxelScript Class
class VoxelClass {
  constructor(name, parent, methods, staticMethods, properties, staticProperties) {
    this.__name__ = name;
    this.__parent__ = parent;
    this.__methods__ = methods;
    this.__staticMethods__ = staticMethods;
    this.__properties__ = properties;
    this.__staticProperties__ = staticProperties;
    this.__isVoxelClass__ = true;
  }
}

// Environment for variable scoping
class Environment {
  constructor(parent = null) {
    this.variables = new Map();
    this.constants = new Set();
    this.parent = parent;
  }

  define(name, value, isConst = false) {
    this.variables.set(name, value);
    if (isConst) {
      this.constants.add(name);
    }
  }

  get(name) {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  set(name, value) {
    if (this.constants.has(name)) {
      throw new Error(`Cannot reassign constant: ${name}`);
    }
    if (this.variables.has(name)) {
      this.variables.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  has(name) {
    if (this.variables.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }
  
  delete(name) {
    if (this.constants.has(name)) {
      throw new Error(`Cannot delete constant: ${name}`);
    }
    if (this.variables.has(name)) {
      this.variables.delete(name);
      return true;
    }
    if (this.parent) {
      return this.parent.delete(name);
    }
    return false;
  }
}

// Built-in functions
const builtins = {
  // ===== MATH =====
  abs: (x) => Math.abs(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  round: (x, decimals = 0) => {
    const factor = Math.pow(10, decimals);
    return Math.round(x * factor) / factor;
  },
  sqrt: (x) => Math.sqrt(x),
  cbrt: (x) => Math.cbrt(x),
  pow: (x, y) => Math.pow(x, y),
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
  random: (min, max) => {
    if (min === undefined) return Math.random();
    if (max === undefined) return Math.floor(Math.random() * min);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  atan2: (y, x) => Math.atan2(y, x),
  sinh: (x) => Math.sinh(x),
  cosh: (x) => Math.cosh(x),
  tanh: (x) => Math.tanh(x),
  log: (x) => Math.log(x),
  log10: (x) => Math.log10(x),
  log2: (x) => Math.log2(x),
  exp: (x) => Math.exp(x),
  sign: (x) => Math.sign(x),
  clamp: (x, min, max) => Math.min(Math.max(x, min), max),
  lerp: (a, b, t) => a + (b - a) * t,
  map: (x, inMin, inMax, outMin, outMax) => (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin,
  distance: (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2),
  distance3d: (x1, y1, z1, x2, y2, z2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2 + (z2-z1)**2),
  degrees: (rad) => rad * 180 / Math.PI,
  radians: (deg) => deg * Math.PI / 180,
  factorial: (n) => { let r = 1; for(let i = 2; i <= n; i++) r *= i; return r; },
  gcd: (a, b) => { while(b) { [a, b] = [b, a % b]; } return a; },
  lcm: (a, b) => (a * b) / builtins.gcd(a, b),
  isPrime: (n) => {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
    return true;
  },
  fibonacci: (n) => {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
    return b;
  },
  sum: (arr) => arr.reduce((a, b) => a + b, 0),
  avg: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
  median: (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  
  // ===== STRING =====
  len: (x) => {
    if (typeof x === 'string' || Array.isArray(x)) return x.length;
    if (typeof x === 'object' && x !== null) return Object.keys(x).length;
    return 0;
  },
  upper: (s) => String(s).toUpperCase(),
  lower: (s) => String(s).toLowerCase(),
  trim: (s) => String(s).trim(),
  trimStart: (s) => String(s).trimStart(),
  trimEnd: (s) => String(s).trimEnd(),
  split: (s, sep) => String(s).split(sep),
  join: (arr, sep = '') => arr.join(sep),
  replace: (s, old, newStr) => String(s).split(old).join(newStr),
  replaceFirst: (s, old, newStr) => String(s).replace(old, newStr),
  substr: (s, start, len) => String(s).substr(start, len),
  substring: (s, start, end) => String(s).substring(start, end),
  includes: (s, sub) => {
    if (Array.isArray(s)) return s.includes(sub);
    return String(s).includes(sub);
  },
  startsWith: (s, sub) => String(s).startsWith(sub),
  endsWith: (s, sub) => String(s).endsWith(sub),
  charAt: (s, i) => String(s).charAt(i),
  charCode: (s, i = 0) => String(s).charCodeAt(i),
  fromCharCode: (...codes) => String.fromCharCode(...codes),
  indexOf: (s, sub) => {
    if (Array.isArray(s)) return s.indexOf(sub);
    return String(s).indexOf(sub);
  },
  lastIndexOf: (s, sub) => String(s).lastIndexOf(sub),
  padStart: (s, len, char = ' ') => String(s).padStart(len, char),
  padEnd: (s, len, char = ' ') => String(s).padEnd(len, char),
  repeat: (s, n) => String(s).repeat(n),
  reverse: (x) => {
    if (Array.isArray(x)) return [...x].reverse();
    return String(x).split('').reverse().join('');
  },
  capitalize: (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase(),
  titleCase: (s) => String(s).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
  camelCase: (s) => String(s).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : ''),
  snakeCase: (s) => String(s).replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
  kebabCase: (s) => String(s).replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''),
  words: (s) => String(s).match(/\b\w+\b/g) || [],
  lines: (s) => String(s).split(/\r?\n/),
  isDigit: (s) => /^\d+$/.test(s),
  isAlpha: (s) => /^[a-zA-Z]+$/.test(s),
  isAlnum: (s) => /^[a-zA-Z0-9]+$/.test(s),
  isSpace: (s) => /^\s+$/.test(s),
  count: (s, sub) => (String(s).match(new RegExp(sub, 'g')) || []).length,
  format: (template, ...args) => {
    return template.replace(/{(\d+)}/g, (match, i) => args[i] !== undefined ? args[i] : match);
  },
  
  // ===== ARRAY =====
  push: (arr, ...items) => { arr.push(...items); return arr; },
  pop: (arr) => arr.pop(),
  shift: (arr) => arr.shift(),
  unshift: (arr, ...items) => { arr.unshift(...items); return arr; },
  slice: (arr, start, end) => arr.slice(start, end),
  splice: (arr, start, count, ...items) => { arr.splice(start, count, ...items); return arr; },
  sort: (arr, desc = false) => [...arr].sort((a, b) => desc ? b - a : a - b),
  sortBy: (arr, key) => [...arr].sort((a, b) => a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0),
  concat: (arr, ...others) => arr.concat(...others),
  flat: (arr, depth = 1) => arr.flat(depth),
  flatMap: (arr, fn) => arr.flatMap(fn),
  unique: (arr) => [...new Set(arr)],
  compact: (arr) => arr.filter(Boolean),
  zip: (...arrs) => arrs[0].map((_, i) => arrs.map(arr => arr[i])),
  unzip: (arr) => arr[0].map((_, i) => arr.map(row => row[i])),
  chunk: (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
    return result;
  },
  shuffle: (arr) => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
  sample: (arr, n = 1) => {
    const shuffled = builtins.shuffle(arr);
    return n === 1 ? shuffled[0] : shuffled.slice(0, n);
  },
  first: (arr, n) => n ? arr.slice(0, n) : arr[0],
  last: (arr, n) => n ? arr.slice(-n) : arr[arr.length - 1],
  nth: (arr, n) => n < 0 ? arr[arr.length + n] : arr[n],
  take: (arr, n) => arr.slice(0, n),
  drop: (arr, n) => arr.slice(n),
  takeWhile: (arr, fn) => {
    const result = [];
    for (const item of arr) { if (!fn(item)) break; result.push(item); }
    return result;
  },
  dropWhile: (arr, fn) => {
    let i = 0;
    while (i < arr.length && fn(arr[i])) i++;
    return arr.slice(i);
  },
  partition: (arr, fn) => [arr.filter(fn), arr.filter(x => !fn(x))],
  groupBy: (arr, key) => {
    return arr.reduce((acc, item) => {
      const k = typeof key === 'function' ? key(item) : item[key];
      (acc[k] = acc[k] || []).push(item);
      return acc;
    }, {});
  },
  countBy: (arr, key) => {
    return arr.reduce((acc, item) => {
      const k = typeof key === 'function' ? key(item) : item[key];
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  },
  range: (start, end, step = 1) => {
    if (end === undefined) { end = start; start = 0; }
    const result = [];
    if (step > 0) for (let i = start; i < end; i += step) result.push(i);
    else for (let i = start; i > end; i += step) result.push(i);
    return result;
  },
  fill: (n, val) => Array(n).fill(typeof val === 'function' ? undefined : val).map((v, i) => typeof val === 'function' ? val(i) : v),
  times: (n, fn) => Array.from({length: n}, (_, i) => fn(i)),
  
  // ===== FUNCTIONAL =====
  map: (arr, fn) => arr.map(fn),
  filter: (arr, fn) => arr.filter(fn),
  reduce: (arr, fn, init) => init !== undefined ? arr.reduce(fn, init) : arr.reduce(fn),
  reduceRight: (arr, fn, init) => init !== undefined ? arr.reduceRight(fn, init) : arr.reduceRight(fn),
  find: (arr, fn) => arr.find(fn),
  findIndex: (arr, fn) => arr.findIndex(fn),
  findLast: (arr, fn) => arr.slice().reverse().find(fn),
  every: (arr, fn) => arr.every(fn),
  some: (arr, fn) => arr.some(fn),
  none: (arr, fn) => !arr.some(fn),
  forEach: (arr, fn) => { arr.forEach(fn); return arr; },
  tap: (val, fn) => { fn(val); return val; },
  pipe: (val, ...fns) => fns.reduce((v, fn) => fn(v), val),
  compose: (...fns) => (val) => fns.reduceRight((v, fn) => fn(v), val),
  curry: (fn) => {
    const arity = fn.length;
    return function curried(...args) {
      if (args.length >= arity) return fn(...args);
      return (...more) => curried(...args, ...more);
    };
  },
  memoize: (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (!cache.has(key)) cache.set(key, fn(...args));
      return cache.get(key);
    };
  },
  debounce: (fn, ms) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  },
  throttle: (fn, ms) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; return fn(...args); }
    };
  },
  
  // ===== TYPE CONVERSION =====
  num: (x) => Number(x),
  int: (x) => parseInt(x, 10),
  float: (x) => parseFloat(x),
  str: (x) => {
    if (typeof x === 'object') return JSON.stringify(x);
    return String(x);
  },
  bool: (x) => Boolean(x),
  array: (x) => Array.isArray(x) ? x : Array.from(x),
  set: (arr) => [...new Set(arr)],
  
  // ===== TYPE CHECKING =====
  type: (x) => {
    if (x === null) return 'null';
    if (Array.isArray(x)) return 'array';
    return typeof x;
  },
  isNum: (x) => typeof x === 'number' && !isNaN(x),
  isInt: (x) => Number.isInteger(x),
  isFloat: (x) => typeof x === 'number' && !Number.isInteger(x),
  isStr: (x) => typeof x === 'string',
  isBool: (x) => typeof x === 'boolean',
  isArray: (x) => Array.isArray(x),
  isObject: (x) => typeof x === 'object' && x !== null && !Array.isArray(x),
  isNull: (x) => x === null,
  isUndefined: (x) => x === undefined,
  isNaN: (x) => Number.isNaN(x),
  isFinite: (x) => Number.isFinite(x),
  isFn: (x) => typeof x === 'function' || (x && x.__isVoxelFunction),
  isEmpty: (x) => {
    if (!x) return true;
    if (Array.isArray(x)) return x.length === 0;
    if (typeof x === 'object') return Object.keys(x).length === 0;
    if (typeof x === 'string') return x.length === 0;
    return false;
  },
  
  // ===== OBJECT =====
  keys: (obj) => Object.keys(obj),
  values: (obj) => Object.values(obj),
  entries: (obj) => Object.entries(obj),
  fromEntries: (arr) => Object.fromEntries(arr),
  has: (obj, key) => obj && obj.hasOwnProperty(key),
  get: (obj, path, def) => {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) return def;
    }
    return result;
  },
  set: (obj, path, val) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = val;
    return obj;
  },
  delete: (obj, key) => { delete obj[key]; return obj; },
  assign: (target, ...sources) => Object.assign(target, ...sources),
  merge: (...objs) => Object.assign({}, ...objs),
  clone: (x) => JSON.parse(JSON.stringify(x)),
  deepClone: (x) => JSON.parse(JSON.stringify(x)),
  freeze: (obj) => Object.freeze(obj),
  pick: (obj, ...keys) => keys.reduce((acc, key) => { if (key in obj) acc[key] = obj[key]; return acc; }, {}),
  omit: (obj, ...keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k))),
  invert: (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k])),
  mapKeys: (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k, v), v])),
  mapValues: (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)])),
  
  // ===== DATE/TIME =====
  now: () => Date.now(),
  time: () => Date.now(),
  date: () => new Date().toISOString().split('T')[0],
  datetime: () => new Date().toISOString(),
  timestamp: () => Math.floor(Date.now() / 1000),
  year: () => new Date().getFullYear(),
  month: () => new Date().getMonth() + 1,
  day: () => new Date().getDate(),
  hour: () => new Date().getHours(),
  minute: () => new Date().getMinutes(),
  second: () => new Date().getSeconds(),
  weekday: () => new Date().getDay(),
  formatDate: (ts, fmt = 'YYYY-MM-DD') => {
    const d = new Date(ts);
    return fmt
      .replace('YYYY', d.getFullYear())
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'))
      .replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0'))
      .replace('ss', String(d.getSeconds()).padStart(2, '0'));
  },
  parseDate: (s) => new Date(s).getTime(),
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // ===== UTILITY =====
  print: (...args) => console.log(...args),
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  assert: (cond, msg = 'Assertion failed') => { if (!cond) throw new Error(msg); },
  json: (x) => JSON.stringify(x, null, 2),
  parse: (s) => JSON.parse(s),
  encode: (s) => encodeURIComponent(s),
  decode: (s) => decodeURIComponent(s),
  base64Encode: (s) => Buffer.from(s).toString('base64'),
  base64Decode: (s) => Buffer.from(s, 'base64').toString('utf8'),
  hash: (s) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },
  uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }),
  randomId: (len = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },
  
  // ===== REGEX =====
  match: (s, pattern) => String(s).match(new RegExp(pattern, 'g')),
  matchAll: (s, pattern) => [...String(s).matchAll(new RegExp(pattern, 'g'))].map(m => m[0]),
  test: (s, pattern) => new RegExp(pattern).test(s),
  extract: (s, pattern) => {
    const match = String(s).match(new RegExp(pattern));
    return match ? (match[1] || match[0]) : null;
  },
  
  // ===== CONSTANTS =====
  PI: Math.PI,
  E: Math.E,
  TAU: Math.PI * 2,
  PHI: (1 + Math.sqrt(5)) / 2,
  SQRT2: Math.SQRT2,
  INF: Infinity,
  NAN: NaN,
  
  // ===== FILE OPERATIONS =====
  readFile: (path) => {
    const fs = require('fs');
    return fs.readFileSync(path, 'utf8');
  },
  writeFile: (path, content) => {
    const fs = require('fs');
    fs.writeFileSync(path, content);
    return true;
  },
  appendFile: (path, content) => {
    const fs = require('fs');
    fs.appendFileSync(path, content);
    return true;
  },
  exists: (path) => {
    const fs = require('fs');
    return fs.existsSync(path);
  },
  listDir: (path) => {
    const fs = require('fs');
    return fs.readdirSync(path);
  },
  mkdir: (path) => {
    const fs = require('fs');
    fs.mkdirSync(path, { recursive: true });
    return true;
  },
  remove: (path) => {
    const fs = require('fs');
    fs.rmSync(path, { recursive: true, force: true });
    return true;
  },
  copy: (src, dest) => {
    const fs = require('fs');
    fs.copyFileSync(src, dest);
    return true;
  },
  move: (src, dest) => {
    const fs = require('fs');
    fs.renameSync(src, dest);
    return true;
  },
  
  // ===== HTTP =====
  fetch: async (url, options = {}) => {
    const https = require('https');
    const http = require('http');
    const protocol = url.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
      const req = protocol.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  },
  
  // ===== COLORS (for terminal) =====
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  magenta: (s) => `\x1b[35m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  underline: (s) => `\x1b[4m${s}\x1b[0m`,
  
  // =============================================
  // MULTI-LANGUAGE LIBRARY SUPPORT
  // =============================================
  
  // ===== PYTHON-STYLE FUNCTIONS =====
  // List comprehension helpers
  listcomp: (arr, fn, condition) => {
    const result = [];
    for (const item of arr) {
      if (!condition || condition(item)) {
        result.push(fn(item));
      }
    }
    return result;
  },
  enumerate: (arr, start = 0) => arr.map((v, i) => [i + start, v]),
  zip: (...arrs) => arrs[0].map((_, i) => arrs.map(arr => arr[i])),
  zipLongest: (...arrs) => {
    const maxLen = Math.max(...arrs.map(a => a.length));
    return Array.from({length: maxLen}, (_, i) => arrs.map(arr => arr[i]));
  },
  all: (arr) => arr.every(Boolean),
  any: (arr) => arr.some(Boolean),
  sum: (arr) => arr.reduce((a, b) => a + b, 0),
  product: (arr) => arr.reduce((a, b) => a * b, 1),
  min: (...args) => args.length === 1 && Array.isArray(args[0]) ? Math.min(...args[0]) : Math.min(...args),
  max: (...args) => args.length === 1 && Array.isArray(args[0]) ? Math.max(...args[0]) : Math.max(...args),
  sorted: (arr, key, reverse = false) => {
    const result = [...arr];
    result.sort((a, b) => {
      const va = key ? (typeof key === 'function' ? key(a) : a[key]) : a;
      const vb = key ? (typeof key === 'function' ? key(b) : b[key]) : b;
      return va < vb ? -1 : va > vb ? 1 : 0;
    });
    return reverse ? result.reverse() : result;
  },
  reversed: (arr) => [...arr].reverse(),
  
  // Python dict methods
  dict: (entries) => Object.fromEntries(entries || []),
  dictGet: (obj, key, def = null) => obj.hasOwnProperty(key) ? obj[key] : def,
  dictItems: (obj) => Object.entries(obj),
  dictKeys: (obj) => Object.keys(obj),
  dictValues: (obj) => Object.values(obj),
  dictUpdate: (obj, other) => Object.assign(obj, other),
  dictPop: (obj, key, def = null) => {
    const val = obj.hasOwnProperty(key) ? obj[key] : def;
    delete obj[key];
    return val;
  },
  dictSetDefault: (obj, key, def = null) => {
    if (!obj.hasOwnProperty(key)) obj[key] = def;
    return obj[key];
  },
  
  // Python string methods
  strip: (s) => String(s).trim(),
  lstrip: (s) => String(s).trimStart(),
  rstrip: (s) => String(s).trimEnd(),
  splitlines: (s) => String(s).split(/\r?\n/),
  zfill: (s, width) => String(s).padStart(width, '0'),
  center: (s, width, char = ' ') => {
    s = String(s);
    const padding = width - s.length;
    const left = Math.floor(padding / 2);
    const right = padding - left;
    return char.repeat(left) + s + char.repeat(right);
  },
  ljust: (s, width, char = ' ') => String(s).padEnd(width, char),
  rjust: (s, width, char = ' ') => String(s).padStart(width, char),
  
  // Python itertools style
  chain: (...arrs) => arrs.flat(),
  repeat: (val, n) => Array(n).fill(val),
  cycle: (arr, n) => {
    const result = [];
    for (let i = 0; i < n; i++) result.push(arr[i % arr.length]);
    return result;
  },
  combinations: (arr, r) => {
    if (r === 1) return arr.map(x => [x]);
    const result = [];
    for (let i = 0; i <= arr.length - r; i++) {
      const head = arr[i];
      const tail = arr.slice(i + 1);
      for (const combo of builtins.combinations(tail, r - 1)) {
        result.push([head, ...combo]);
      }
    }
    return result;
  },
  permutations: (arr, r = arr.length) => {
    if (r === 1) return arr.map(x => [x]);
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const head = arr[i];
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of builtins.permutations(rest, r - 1)) {
        result.push([head, ...perm]);
      }
    }
    return result;
  },
  
  // ===== CSS-STYLE COLOR FUNCTIONS =====
  rgb: (r, g, b) => ({ r, g, b, a: 1, toString: () => `rgb(${r}, ${g}, ${b})` }),
  rgba: (r, g, b, a) => ({ r, g, b, a, toString: () => `rgba(${r}, ${g}, ${b}, ${a})` }),
  hsl: (h, s, l) => {
    // Convert HSL to RGB
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a: 1,
      toString: () => `hsl(${h}, ${s * 100}%, ${l * 100}%)`
    };
  },
  hsla: (h, s, l, a) => {
    const color = builtins.hsl(h, s, l);
    color.a = a;
    color.toString = () => `hsla(${h}, ${s}%, ${l}%, ${a})`;
    return color;
  },
  hex: (hexStr) => {
    const hex = hexStr.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const a = hex.length === 8 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
    return { r, g, b, a, toString: () => `#${hex}` };
  },
  toHex: (color) => {
    const r = color.r.toString(16).padStart(2, '0');
    const g = color.g.toString(16).padStart(2, '0');
    const b = color.b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  },
  lighten: (color, amount) => ({
    r: Math.min(255, color.r + amount),
    g: Math.min(255, color.g + amount),
    b: Math.min(255, color.b + amount),
    a: color.a
  }),
  darken: (color, amount) => ({
    r: Math.max(0, color.r - amount),
    g: Math.max(0, color.g - amount),
    b: Math.max(0, color.b - amount),
    a: color.a
  }),
  saturate: (color, amount) => {
    const gray = (color.r + color.g + color.b) / 3;
    return {
      r: Math.min(255, color.r + (color.r - gray) * amount),
      g: Math.min(255, color.g + (color.g - gray) * amount),
      b: Math.min(255, color.b + (color.b - gray) * amount),
      a: color.a
    };
  },
  desaturate: (color, amount) => {
    const gray = (color.r + color.g + color.b) / 3;
    return {
      r: color.r - (color.r - gray) * amount,
      g: color.g - (color.g - gray) * amount,
      b: color.b - (color.b - gray) * amount,
      a: color.a
    };
  },
  invert: (color) => ({
    r: 255 - color.r,
    g: 255 - color.g,
    b: 255 - color.b,
    a: color.a
  }),
  grayscale: (color) => {
    const gray = Math.round(color.r * 0.299 + color.g * 0.587 + color.b * 0.114);
    return { r: gray, g: gray, b: gray, a: color.a };
  },
  mix: (color1, color2, weight = 0.5) => ({
    r: Math.round(color1.r * (1 - weight) + color2.r * weight),
    g: Math.round(color1.g * (1 - weight) + color2.g * weight),
    b: Math.round(color1.b * (1 - weight) + color2.b * weight),
    a: color1.a * (1 - weight) + color2.a * weight
  }),
  complement: (color) => ({
    r: 255 - color.r,
    g: 255 - color.g,
    b: 255 - color.b,
    a: color.a
  }),
  alpha: (color, a) => ({ ...color, a }),
  opacity: (color, a) => ({ ...color, a }),
  
  // CSS calc-style functions
  calc: (expr) => {
    // Simple expression evaluator for calc-like operations
    return eval(expr.replace(/px|em|rem|%/g, ''));
  },
  clamp: (min, val, max) => Math.min(max, Math.max(min, val)),
  
  // ===== SDL2-STYLE GRAPHICS LIBRARY =====
  // These return data structures for graphics rendering
  // Canvas/Screen simulation (returns render commands)
  
  // Window management
  createWindow: (title, width, height) => ({
    type: 'window',
    title,
    width,
    height,
    commands: [],
    objects: []
  }),
  
  setWindowTitle: (win, title) => { win.title = title; return win; },
  setWindowSize: (win, w, h) => { win.width = w; win.height = h; return win; },
  
  // Drawing primitives (SDL2-style)
  drawPoint: (x, y, color = {r: 255, g: 255, b: 255}) => ({
    type: 'point', x, y, color
  }),
  
  drawLine: (x1, y1, x2, y2, color = {r: 255, g: 255, b: 255}, thickness = 1) => ({
    type: 'line', x1, y1, x2, y2, color, thickness
  }),
  
  drawRect: (x, y, w, h, color = {r: 255, g: 255, b: 255}, filled = false) => ({
    type: 'rect', x, y, w, h, color, filled
  }),
  
  drawCircle: (x, y, radius, color = {r: 255, g: 255, b: 255}, filled = false) => ({
    type: 'circle', x, y, radius, color, filled
  }),
  
  drawEllipse: (x, y, rx, ry, color = {r: 255, g: 255, b: 255}, filled = false) => ({
    type: 'ellipse', x, y, rx, ry, color, filled
  }),
  
  drawTriangle: (x1, y1, x2, y2, x3, y3, color = {r: 255, g: 255, b: 255}, filled = false) => ({
    type: 'triangle', x1, y1, x2, y2, x3, y3, color, filled
  }),
  
  drawPolygon: (points, color = {r: 255, g: 255, b: 255}, filled = false) => ({
    type: 'polygon', points, color, filled
  }),
  
  drawArc: (x, y, radius, startAngle, endAngle, color = {r: 255, g: 255, b: 255}) => ({
    type: 'arc', x, y, radius, startAngle, endAngle, color
  }),
  
  drawText: (text, x, y, color = {r: 255, g: 255, b: 255}, size = 16, font = 'monospace') => ({
    type: 'text', text, x, y, color, size, font
  }),
  
  drawImage: (src, x, y, w, h) => ({
    type: 'image', src, x, y, w, h
  }),
  
  // Sprites (game objects)
  createSprite: (x, y, w, h, color) => ({
    type: 'sprite',
    x, y, w, h,
    color: color || {r: 255, g: 255, b: 255},
    velocity: {x: 0, y: 0},
    acceleration: {x: 0, y: 0},
    rotation: 0,
    scale: 1,
    visible: true,
    collider: {type: 'rect', w, h}
  }),
  
  moveSprite: (sprite, dx, dy) => {
    sprite.x += dx;
    sprite.y += dy;
    return sprite;
  },
  
  setPosition: (sprite, x, y) => {
    sprite.x = x;
    sprite.y = y;
    return sprite;
  },
  
  setVelocity: (sprite, vx, vy) => {
    sprite.velocity = {x: vx, y: vy};
    return sprite;
  },
  
  setAcceleration: (sprite, ax, ay) => {
    sprite.acceleration = {x: ax, y: ay};
    return sprite;
  },
  
  updateSprite: (sprite, dt = 1) => {
    sprite.velocity.x += sprite.acceleration.x * dt;
    sprite.velocity.y += sprite.acceleration.y * dt;
    sprite.x += sprite.velocity.x * dt;
    sprite.y += sprite.velocity.y * dt;
    return sprite;
  },
  
  // Collision detection
  collides: (a, b) => {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  },
  
  collidesCircle: (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (a.radius || a.w/2) + (b.radius || b.w/2);
  },
  
  collidesPoint: (sprite, px, py) => {
    return px >= sprite.x && px <= sprite.x + sprite.w &&
           py >= sprite.y && py <= sprite.y + sprite.h;
  },
  
  // Input simulation
  createInput: () => ({
    keys: {},
    mouse: {x: 0, y: 0, buttons: {}},
    onKey: null,
    onMouse: null
  }),
  
  isKeyDown: (input, key) => input.keys[key] === true,
  isKeyUp: (input, key) => input.keys[key] !== true,
  isMouseDown: (input, button = 'left') => input.mouse.buttons[button] === true,
  getMousePos: (input) => ({x: input.mouse.x, y: input.mouse.y}),
  
  // Audio (data structures)
  createSound: (src) => ({
    type: 'sound',
    src,
    volume: 1,
    loop: false,
    playing: false
  }),
  
  playSound: (sound) => { sound.playing = true; return sound; },
  stopSound: (sound) => { sound.playing = false; return sound; },
  setVolume: (sound, vol) => { sound.volume = vol; return sound; },
  setLoop: (sound, loop) => { sound.loop = loop; return sound; },
  
  // Scene management
  createScene: (name) => ({
    type: 'scene',
    name,
    objects: [],
    active: false
  }),
  
  addToScene: (scene, obj) => { scene.objects.push(obj); return scene; },
  removeFromScene: (scene, obj) => {
    const idx = scene.objects.indexOf(obj);
    if (idx > -1) scene.objects.splice(idx, 1);
    return scene;
  },
  
  // ===== EXTENDED MATH LIBRARY =====
  // Vector operations (2D and 3D)
  vec2: (x, y) => ({x, y}),
  vec3: (x, y, z) => ({x, y, z}),
  vec4: (x, y, z, w) => ({x, y, z, w}),
  
  vecAdd: (a, b) => a.z !== undefined 
    ? {x: a.x + b.x, y: a.y + b.y, z: a.z + b.z}
    : {x: a.x + b.x, y: a.y + b.y},
  
  vecSub: (a, b) => a.z !== undefined
    ? {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z}
    : {x: a.x - b.x, y: a.y - b.y},
  
  vecMul: (v, scalar) => v.z !== undefined
    ? {x: v.x * scalar, y: v.y * scalar, z: v.z * scalar}
    : {x: v.x * scalar, y: v.y * scalar},
  
  vecDiv: (v, scalar) => v.z !== undefined
    ? {x: v.x / scalar, y: v.y / scalar, z: v.z / scalar}
    : {x: v.x / scalar, y: v.y / scalar},
  
  vecDot: (a, b) => a.z !== undefined
    ? a.x * b.x + a.y * b.y + a.z * b.z
    : a.x * b.x + a.y * b.y,
  
  vecCross: (a, b) => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  }),
  
  vecMag: (v) => v.z !== undefined
    ? Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    : Math.sqrt(v.x * v.x + v.y * v.y),
  
  vecNorm: (v) => {
    const mag = builtins.vecMag(v);
    return builtins.vecDiv(v, mag);
  },
  
  vecDist: (a, b) => builtins.vecMag(builtins.vecSub(a, b)),
  
  vecLerp: (a, b, t) => a.z !== undefined
    ? {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t}
    : {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t},
  
  vecAngle: (v) => Math.atan2(v.y, v.x),
  
  vecFromAngle: (angle, mag = 1) => ({
    x: Math.cos(angle) * mag,
    y: Math.sin(angle) * mag
  }),
  
  vecRotate: (v, angle) => ({
    x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
    y: v.x * Math.sin(angle) + v.y * Math.cos(angle)
  }),
  
  // Matrix operations (4x4 for 3D transforms)
  mat4: () => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ],
  
  mat4Identity: () => builtins.mat4(),
  
  mat4Mul: (a, b) => {
    const result = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
        }
      }
    }
    return result;
  },
  
  mat4Translate: (x, y, z) => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ],
  
  mat4Scale: (x, y, z) => [
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
  ],
  
  mat4RotateX: (angle) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ];
  },
  
  mat4RotateY: (angle) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  },
  
  mat4RotateZ: (angle) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  },
  
  mat4Perspective: (fov, aspect, near, far) => {
    const f = 1 / Math.tan(fov / 2);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ];
  },
  
  mat4LookAt: (eye, center, up) => {
    const z = builtins.vecNorm(builtins.vecSub(eye, center));
    const x = builtins.vecNorm(builtins.vecCross(up, z));
    const y = builtins.vecCross(z, x);
    return [
      x.x, y.x, z.x, 0,
      x.y, y.y, z.y, 0,
      x.z, y.z, z.z, 0,
      -builtins.vecDot(x, eye), -builtins.vecDot(y, eye), -builtins.vecDot(z, eye), 1
    ];
  },
  
  // Complex numbers
  complex: (re, im) => ({re, im}),
  
  complexAdd: (a, b) => ({re: a.re + b.re, im: a.im + b.im}),
  complexSub: (a, b) => ({re: a.re - b.re, im: a.im - b.im}),
  complexMul: (a, b) => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }),
  complexDiv: (a, b) => {
    const denom = b.re * b.re + b.im * b.im;
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom
    };
  },
  complexAbs: (c) => Math.sqrt(c.re * c.re + c.im * c.im),
  complexArg: (c) => Math.atan2(c.im, c.re),
  complexConj: (c) => ({re: c.re, im: -c.im}),
  complexPolar: (r, theta) => ({re: r * Math.cos(theta), im: r * Math.sin(theta)}),
  
  // Quaternions (for 3D rotations)
  quat: (w, x, y, z) => ({w, x, y, z}),
  quatIdentity: () => ({w: 1, x: 0, y: 0, z: 0}),
  
  quatMul: (a, b) => ({
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
  }),
  
  quatFromAxisAngle: (axis, angle) => {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    return {
      w: Math.cos(halfAngle),
      x: axis.x * s,
      y: axis.y * s,
      z: axis.z * s
    };
  },
  
  quatRotateVec: (q, v) => {
    const qv = {w: 0, x: v.x, y: v.y, z: v.z};
    const qConj = {w: q.w, x: -q.x, y: -q.y, z: -q.z};
    const result = builtins.quatMul(builtins.quatMul(q, qv), qConj);
    return {x: result.x, y: result.y, z: result.z};
  },
  
  quatSlerp: (a, b, t) => {
    let dot = a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z;
    if (dot < 0) { b = {w: -b.w, x: -b.x, y: -b.y, z: -b.z}; dot = -dot; }
    if (dot > 0.9995) {
      return {
        w: a.w + t * (b.w - a.w),
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y),
        z: a.z + t * (b.z - a.z)
      };
    }
    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;
    return {
      w: s0 * a.w + s1 * b.w,
      x: s0 * a.x + s1 * b.x,
      y: s0 * a.y + s1 * b.y,
      z: s0 * a.z + s1 * b.z
    };
  },
  
  // Additional math functions
  lerp: (a, b, t) => a + (b - a) * t,
  inverseLerp: (a, b, v) => (v - a) / (b - a),
  remap: (v, inMin, inMax, outMin, outMax) => outMin + (v - inMin) * (outMax - outMin) / (inMax - inMin),
  smoothstep: (edge0, edge1, x) => {
    const t = builtins.clamp(0, (x - edge0) / (edge1 - edge0), 1);
    return t * t * (3 - 2 * t);
  },
  smootherstep: (edge0, edge1, x) => {
    const t = builtins.clamp(0, (x - edge0) / (edge1 - edge0), 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  },
  
  fract: (x) => x - Math.floor(x),
  mod: (x, y) => ((x % y) + y) % y,
  wrap: (x, min, max) => min + builtins.mod(x - min, max - min),
  
  degToRad: (deg) => deg * Math.PI / 180,
  radToDeg: (rad) => rad * 180 / Math.PI,
  
  // Noise functions
  noise: (x, y = 0, z = 0) => {
    // Simple Perlin-like noise approximation
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + t * (b - a);
    const grad = (hash, x, y, z) => {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    };
    const p = new Array(512);
    const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];
    
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    
    return lerp(lerp(lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
                     lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
                lerp(lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
                     lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  },
  
  fbm: (x, y, octaves = 4, lacunarity = 2, gain = 0.5) => {
    let value = 0, amplitude = 1, frequency = 1, maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * builtins.noise(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }
    return value / maxValue;
  },
  
  // Statistics
  mean: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
  median: (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  mode: (arr) => {
    const counts = {};
    arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
    return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  },
  variance: (arr) => {
    const m = builtins.mean(arr);
    return arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  },
  stddev: (arr) => Math.sqrt(builtins.variance(arr)),
  
  // Easing functions (for animations)
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInElastic: (t) => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI),
  easeOutElastic: (t) => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1,
  easeInBounce: (t) => 1 - builtins.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
};

class Interpreter {
  constructor() {
    this.global = new Environment();
    this.environment = this.global;
    this.inputQueue = [];
    this.inputResolver = null;
    this.currentThis = null;
    this.modules = new Map();
    
    // Load built-ins
    for (const [name, fn] of Object.entries(builtins)) {
      this.global.define(name, fn);
    }
  }

  async run(ast) {
    try {
      let result = null;
      for (const statement of ast.statements) {
        result = await this.evaluate(statement);
      }
      return result;
    } catch (error) {
      if (error instanceof ReturnValue) {
        return error.value;
      }
      throw error;
    }
  }

  async evaluate(node) {
    if (!node) return null;
    
    switch (node.type) {
      case 'Program':
        return this.run(node);
        
      case 'NumberLiteral':
        return node.value;
        
      case 'StringLiteral':
        return node.value;
        
      case 'TemplateLiteral':
        return this.evaluateTemplateLiteral(node);
        
      case 'BoolLiteral':
        return node.value;
        
      case 'NullLiteral':
        return null;
        
      case 'ArrayLiteral': {
        const elements = [];
        for (const el of node.elements) {
          if (el === null) {
            elements.push(undefined); // Sparse array
          } else if (el.type === 'SpreadElement') {
            const spread = await this.evaluate(el.argument);
            elements.push(...spread);
          } else {
            elements.push(await this.evaluate(el));
          }
        }
        return elements;
      }
        
      case 'ObjectLiteral': {
        const obj = {};
        for (const [key, value] of Object.entries(node.properties)) {
          if (key.startsWith('...spread')) {
            const spread = await this.evaluate(value.argument);
            Object.assign(obj, spread);
          } else {
            obj[key] = await this.evaluate(value);
          }
        }
        return obj;
      }
      
      case 'SpreadElement':
        return await this.evaluate(node.argument);
        
      case 'Identifier':
        return this.environment.get(node.name);
        
      case 'ThisExpr':
        return this.currentThis;
        
      case 'SuperExpr':
        if (this.currentThis && this.currentThis.__class__?.__parent__) {
          return this.currentThis.__class__.__parent__;
        }
        throw new Error("'super' used outside of class context");
        
      case 'BinaryExpr':
        return this.evaluateBinary(node);
        
      case 'UnaryExpr':
        return this.evaluateUnary(node);
        
      case 'UpdateExpr':
        return this.evaluateUpdate(node);
        
      case 'TernaryExpr': {
        const condition = await this.evaluate(node.condition);
        return condition ? await this.evaluate(node.consequent) : await this.evaluate(node.alternate);
      }
        
      case 'NullishCoalescing': {
        const left = await this.evaluate(node.left);
        return (left === null || left === undefined) ? await this.evaluate(node.right) : left;
      }
        
      case 'OptionalChain':
        return this.evaluateOptionalChain(node);
        
      case 'PipeExpr':
        return this.evaluatePipe(node);
        
      case 'LetDeclaration': {
        const value = node.value ? await this.evaluate(node.value) : null;
        this.environment.define(node.name, value, node.isConst);
        return value;
      }
        
      case 'DestructuringDeclaration':
        return this.evaluateDestructuring(node);
        
      case 'Assignment':
        return this.evaluateAssignment(node);
        
      case 'FunctionDeclaration': {
        const fn = {
          __isVoxelFunction: true,
          params: node.params,
          body: node.body,
          closure: this.environment,
          isAsync: node.isAsync
        };
        if (node.name) {
          this.environment.define(node.name, fn);
        }
        return fn;
      }
        
      case 'ArrowFunction': {
        return {
          __isVoxelFunction: true,
          params: node.params,
          body: node.body,
          closure: this.environment,
          isAsync: node.isAsync,
          boundThis: this.currentThis // Arrow functions capture 'this'
        };
      }
        
      case 'FunctionCall':
        return this.evaluateCall(node);
        
      case 'NewExpr':
        return this.evaluateNew(node);
        
      case 'AwaitExpr': {
        const value = await this.evaluate(node.argument);
        return value instanceof Promise ? await value : value;
      }
        
      case 'ClassDeclaration':
        return this.evaluateClass(node);
        
      case 'IfStatement':
        return this.evaluateIf(node);
        
      case 'SwitchStatement':
        return this.evaluateSwitch(node);
        
      case 'LoopStatement':
        return this.evaluateLoop(node);
        
      case 'ForInStatement':
        return this.evaluateForIn(node);
        
      case 'ForOfStatement':
        return this.evaluateForOf(node);
        
      case 'WhileStatement':
        return this.evaluateWhile(node);
        
      case 'DoWhileStatement':
        return this.evaluateDoWhile(node);
        
      case 'TryStatement':
        return this.evaluateTry(node);
        
      case 'ThrowStatement': {
        const value = await this.evaluate(node.argument);
        throw new ThrowError(value);
      }
        
      case 'ReturnStatement': {
        const value = node.value ? await this.evaluate(node.value) : null;
        throw new ReturnValue(value);
      }
        
      case 'BreakStatement':
        throw new BreakLoop();
        
      case 'ContinueStatement':
        throw new ContinueLoop();
        
      case 'PrintStatement': {
        const value = await this.evaluate(node.value);
        console.log(value);
        return value;
      }
        
      case 'InputExpr':
        return this.evaluateInput(node);
        
      case 'TypeOfExpr': {
        const value = await this.evaluate(node.argument);
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (value instanceof VoxelInstance) return 'object';
        return typeof value;
      }
        
      case 'InstanceOfExpr': {
        const left = await this.evaluate(node.left);
        const right = await this.evaluate(node.right);
        if (left instanceof VoxelInstance && right?.__isVoxelClass__) {
          let klass = left.__class__;
          while (klass) {
            if (klass === right) return true;
            klass = klass.__parent__;
          }
          return false;
        }
        return false;
      }
        
      case 'DeleteExpr': {
        if (node.argument.type === 'MemberAccess') {
          const obj = await this.evaluate(node.argument.object);
          delete obj[node.argument.property];
          return true;
        }
        if (node.argument.type === 'IndexAccess') {
          const obj = await this.evaluate(node.argument.object);
          const index = await this.evaluate(node.argument.index);
          delete obj[index];
          return true;
        }
        if (node.argument.type === 'Identifier') {
          return this.environment.delete(node.argument.name);
        }
        return false;
      }
        
      case 'IndexAccess': {
        const obj = await this.evaluate(node.object);
        const index = await this.evaluate(node.index);
        if (obj instanceof VoxelInstance) {
          return obj.get(index) ?? obj.__properties__[index];
        }
        return obj[index];
      }
        
      case 'MemberAccess': {
        const obj = await this.evaluate(node.object);
        if (obj instanceof VoxelInstance) {
          return obj.get(node.property);
        }
        if (obj instanceof VoxelClass) {
          // Static access
          return obj.__staticProperties__[node.property] ?? obj.__staticMethods__[node.property];
        }
        return obj?.[node.property];
      }
        
      case 'Block': {
        const previous = this.environment;
        this.environment = new Environment(previous);
        let result = null;
        try {
          for (const stmt of node.statements) {
            result = await this.evaluate(stmt);
          }
        } finally {
          this.environment = previous;
        }
        return result;
      }
      
      case 'ImportStatement':
        return this.evaluateImport(node);
        
      case 'ExportStatement':
        return this.evaluateExport(node);
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  async evaluateTemplateLiteral(node) {
    let result = '';
    for (const part of node.parts) {
      if (part.type === 'string') {
        result += part.value;
      } else {
        result += String(await this.evaluate(part.value));
      }
    }
    return result;
  }

  async evaluateOptionalChain(node) {
    const obj = await this.evaluate(node.object);
    if (obj === null || obj === undefined) {
      return undefined;
    }
    if (node.computed) {
      const index = await this.evaluate(node.property);
      return obj[index];
    }
    return obj[node.property];
  }

  async evaluatePipe(node) {
    const left = await this.evaluate(node.left);
    const right = await this.evaluate(node.right);
    
    if (typeof right === 'function') {
      return right(left);
    }
    if (right && right.__isVoxelFunction) {
      return this.callVoxelFunction(right, [left]);
    }
    throw new Error("Pipe target must be a function");
  }

  async evaluateDestructuring(node) {
    const value = await this.evaluate(node.value);
    
    if (node.isArray) {
      // Array destructuring
      let i = 0;
      for (const element of node.pattern) {
        if (!element) {
          i++;
          continue;
        }
        if (element.type === 'rest') {
          this.environment.define(element.name, value.slice(i), node.isConst);
          break;
        }
        const val = value[i] !== undefined ? value[i] : (element.default ? await this.evaluate(element.default) : undefined);
        this.environment.define(element.name, val, node.isConst);
        i++;
      }
    } else {
      // Object destructuring
      for (const prop of node.pattern) {
        if (prop.type === 'rest') {
          const rest = { ...value };
          for (const p of node.pattern) {
            if (p.type === 'property') delete rest[p.key];
          }
          this.environment.define(prop.name, rest, node.isConst);
        } else {
          const val = value[prop.key] !== undefined ? value[prop.key] : (prop.default ? await this.evaluate(prop.default) : undefined);
          this.environment.define(prop.name, val, node.isConst);
        }
      }
    }
    return value;
  }

  async evaluateAssignment(node) {
    let value = await this.evaluate(node.value);
    
    // Handle compound assignment
    if (node.operator !== '=') {
      let current;
      if (node.target.type === 'Identifier') {
        current = this.environment.get(node.target.name);
      } else if (node.target.type === 'IndexAccess') {
        const obj = await this.evaluate(node.target.object);
        const index = await this.evaluate(node.target.index);
        current = obj[index];
      } else if (node.target.type === 'MemberAccess') {
        const obj = await this.evaluate(node.target.object);
        current = obj[node.target.property];
      }
      
      switch (node.operator) {
        case '+=': value = current + value; break;
        case '-=': value = current - value; break;
        case '*=': value = current * value; break;
        case '/=': value = current / value; break;
        case '%=': value = current % value; break;
        case '**=': value = Math.pow(current, value); break;
        case '&=': value = current & value; break;
        case '|=': value = current | value; break;
        case '^=': value = current ^ value; break;
        case '<<=': value = current << value; break;
        case '>>=': value = current >> value; break;
      }
    }
    
    if (node.target.type === 'Identifier') {
      this.environment.set(node.target.name, value);
    } else if (node.target.type === 'IndexAccess') {
      const obj = await this.evaluate(node.target.object);
      const index = await this.evaluate(node.target.index);
      obj[index] = value;
    } else if (node.target.type === 'MemberAccess') {
      const obj = await this.evaluate(node.target.object);
      if (obj instanceof VoxelInstance) {
        obj.set(node.target.property, value);
      } else {
        obj[node.target.property] = value;
      }
    }
    return value;
  }

  async evaluateUpdate(node) {
    let value;
    if (node.operand.type === 'Identifier') {
      value = this.environment.get(node.operand.name);
    } else if (node.operand.type === 'MemberAccess') {
      const obj = await this.evaluate(node.operand.object);
      value = obj[node.operand.property];
    } else if (node.operand.type === 'IndexAccess') {
      const obj = await this.evaluate(node.operand.object);
      const index = await this.evaluate(node.operand.index);
      value = obj[index];
    }
    
    const newValue = node.operator === '++' ? value + 1 : value - 1;
    
    // Store new value
    if (node.operand.type === 'Identifier') {
      this.environment.set(node.operand.name, newValue);
    } else if (node.operand.type === 'MemberAccess') {
      const obj = await this.evaluate(node.operand.object);
      obj[node.operand.property] = newValue;
    } else if (node.operand.type === 'IndexAccess') {
      const obj = await this.evaluate(node.operand.object);
      const index = await this.evaluate(node.operand.index);
      obj[index] = newValue;
    }
    
    return node.prefix ? newValue : value;
  }

  async evaluateClass(node) {
    let parentClass = null;
    if (node.superClass) {
      parentClass = this.environment.get(node.superClass);
      if (!parentClass || !parentClass.__isVoxelClass__) {
        throw new Error(`${node.superClass} is not a class`);
      }
    }
    
    const methods = {};
    const staticMethods = {};
    const properties = {};
    const staticProperties = {};
    
    for (const element of node.body) {
      if (element.type === 'MethodDefinition') {
        const method = {
          __isVoxelFunction: true,
          params: element.params,
          body: element.body,
          closure: this.environment,
          isAsync: element.isAsync,
          kind: element.kind
        };
        if (element.isStatic) {
          staticMethods[element.key] = method;
        } else {
          methods[element.key] = method;
        }
      } else if (element.type === 'PropertyDefinition') {
        const value = element.value ? await this.evaluate(element.value) : null;
        if (element.isStatic) {
          staticProperties[element.key] = value;
        } else {
          properties[element.key] = value;
        }
      }
    }
    
    const klass = new VoxelClass(node.name, parentClass, methods, staticMethods, properties, staticProperties);
    this.environment.define(node.name, klass);
    return klass;
  }

  async evaluateNew(node) {
    const klass = await this.evaluate(node.callee);
    if (!klass || !klass.__isVoxelClass__) {
      throw new Error("'new' requires a class");
    }
    
    // Create instance with default properties
    const properties = { ...klass.__properties__ };
    if (klass.__parent__) {
      Object.assign(properties, klass.__parent__.__properties__);
    }
    const instance = new VoxelInstance(klass, properties);
    
    // Call constructor if exists
    const constructor = klass.__methods__.constructor;
    if (constructor) {
      const args = [];
      for (const arg of node.args) {
        args.push(await this.evaluate(arg));
      }
      
      const previousThis = this.currentThis;
      this.currentThis = instance;
      await this.callVoxelFunction(constructor, args);
      this.currentThis = previousThis;
    }
    
    return instance;
  }

  async evaluateSwitch(node) {
    const discriminant = await this.evaluate(node.discriminant);
    let matched = false;
    let result = null;
    
    for (const switchCase of node.cases) {
      if (!matched && switchCase.test !== null) {
        const test = await this.evaluate(switchCase.test);
        if (test === discriminant) {
          matched = true;
        }
      }
      
      // Default case or matched
      if (matched || switchCase.test === null) {
        matched = true;
        try {
          for (const stmt of switchCase.consequent) {
            result = await this.evaluate(stmt);
          }
        } catch (error) {
          if (error instanceof BreakLoop) {
            return result;
          }
          throw error;
        }
      }
    }
    
    return result;
  }

  async evaluateForIn(node) {
    const iterable = await this.evaluate(node.iterable);
    const previous = this.environment;
    
    try {
      if (Array.isArray(iterable)) {
        // For arrays, iterate over values (not indices) - this is VoxelScript style
        for (const value of iterable) {
          this.environment = new Environment(previous);
          this.environment.define(node.variable, value);
          try {
            await this.evaluate(node.body);
          } catch (error) {
            if (error instanceof BreakLoop) break;
            if (error instanceof ContinueLoop) continue;
            throw error;
          }
        }
      } else if (typeof iterable === 'string') {
        // For strings, iterate over characters
        for (const char of iterable) {
          this.environment = new Environment(previous);
          this.environment.define(node.variable, char);
          try {
            await this.evaluate(node.body);
          } catch (error) {
            if (error instanceof BreakLoop) break;
            if (error instanceof ContinueLoop) continue;
            throw error;
          }
        }
      } else if (typeof iterable === 'object' && iterable !== null) {
        // For objects, iterate over keys
        for (const key in iterable) {
          this.environment = new Environment(previous);
          this.environment.define(node.variable, key);
          try {
            await this.evaluate(node.body);
          } catch (error) {
            if (error instanceof BreakLoop) break;
            if (error instanceof ContinueLoop) continue;
            throw error;
          }
        }
      }
    } finally {
      this.environment = previous;
    }
    
    return null;
  }

  async evaluateForOf(node) {
    const iterable = await this.evaluate(node.iterable);
    const previous = this.environment;
    
    try {
      for (const item of iterable) {
        this.environment = new Environment(previous);
        this.environment.define(node.variable, item);
        try {
          await this.evaluate(node.body);
        } catch (error) {
          if (error instanceof BreakLoop) break;
          if (error instanceof ContinueLoop) continue;
          throw error;
        }
      }
    } finally {
      this.environment = previous;
    }
    
    return null;
  }

  async evaluateDoWhile(node) {
    do {
      try {
        await this.evaluate(node.body);
      } catch (error) {
        if (error instanceof BreakLoop) break;
        if (error instanceof ContinueLoop) continue;
        throw error;
      }
    } while (await this.evaluate(node.condition));
    return null;
  }

  async evaluateTry(node) {
    try {
      return await this.evaluate(node.block);
    } catch (error) {
      if (node.handler && (error instanceof ThrowError || !(error instanceof ReturnValue || error instanceof BreakLoop || error instanceof ContinueLoop))) {
        const previous = this.environment;
        this.environment = new Environment(previous);
        
        if (node.handler.param) {
          const value = error instanceof ThrowError ? error.thrownValue : error.message;
          this.environment.define(node.handler.param, value);
        }
        
        try {
          return await this.evaluate(node.handler.body);
        } finally {
          this.environment = previous;
        }
      }
      throw error;
    } finally {
      if (node.finalizer) {
        await this.evaluate(node.finalizer);
      }
    }
  }

  async evaluateImport(node) {
    // For now, just define empty exports
    // In a real implementation, this would load and execute the module
    console.warn(`Import not fully implemented: ${node.source}`);
    for (const spec of node.specifiers) {
      this.environment.define(spec.local || spec.name, null);
    }
    return null;
  }

  async evaluateExport(node) {
    if (node.declaration) {
      return await this.evaluate(node.declaration);
    }
    return null;
  }

  async evaluateBinary(node) {
    const left = await this.evaluate(node.left);
    
    // Short-circuit evaluation
    if (node.operator === 'and') {
      if (!left) return left;
      return await this.evaluate(node.right);
    }
    if (node.operator === 'or') {
      if (left) return left;
      return await this.evaluate(node.right);
    }
    
    const right = await this.evaluate(node.right);
    
    switch (node.operator) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '**': return Math.pow(left, right);
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '&': return left & right;
      case '|': return left | right;
      case '^': return left ^ right;
      case '<<': return left << right;
      case '>>': return left >> right;
      case '>>>': return left >>> right;
      default:
        throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  async evaluateUnary(node) {
    const operand = await this.evaluate(node.operand);
    switch (node.operator) {
      case '-': return -operand;
      case '!':
      case 'not': return !operand;
      case '~': return ~operand;
      default:
        throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  async evaluateCall(node) {
    const callee = await this.evaluate(node.callee);
    const args = [];
    for (const arg of node.args) {
      if (arg.type === 'SpreadElement') {
        const spread = await this.evaluate(arg.argument);
        args.push(...spread);
      } else {
        args.push(await this.evaluate(arg));
      }
    }
    
    if (typeof callee === 'function') {
      // Built-in function
      const result = callee(...args);
      if (result instanceof Promise) {
        return await result;
      }
      return result;
    }
    
    if (callee && callee.__isVoxelFunction) {
      return this.callVoxelFunction(callee, args);
    }
    
    throw new Error(`${callee} is not a function`);
  }

  async callVoxelFunction(fn, args) {
    const previous = this.environment;
    this.environment = new Environment(fn.closure);
    
    const previousThis = this.currentThis;
    if (fn.boundThis !== undefined) {
      this.currentThis = fn.boundThis;
    }
    
    // Bind parameters
    for (let i = 0; i < fn.params.length; i++) {
      const param = fn.params[i];
      if (typeof param === 'string') {
        // Old-style simple param
        this.environment.define(param, args[i] ?? null);
      } else if (param.type === 'rest') {
        this.environment.define(param.name, args.slice(i));
        break;
      } else {
        const value = args[i] !== undefined ? args[i] : (param.default ? await this.evaluate(param.default) : null);
        this.environment.define(param.name, value);
      }
    }
    
    try {
      for (const stmt of fn.body.statements) {
        await this.evaluate(stmt);
      }
    } catch (error) {
      if (error instanceof ReturnValue) {
        return error.value;
      }
      throw error;
    } finally {
      this.environment = previous;
      this.currentThis = previousThis;
    }
    
    return null;
  }

  async evaluateIf(node) {
    const condition = await this.evaluate(node.condition);
    if (condition) {
      return this.evaluate(node.thenBranch);
    } else if (node.elseBranch) {
      return this.evaluate(node.elseBranch);
    }
    return null;
  }

  async evaluateLoop(node) {
    const from = await this.evaluate(node.from);
    const to = await this.evaluate(node.to);
    const step = node.step ? await this.evaluate(node.step) : 1;
    
    const previous = this.environment;
    this.environment = new Environment(previous);
    
    try {
      if (step > 0) {
        for (let i = from; i < to; i += step) {
          this.environment.define(node.variable, i);
          try {
            await this.evaluate(node.body);
          } catch (error) {
            if (error instanceof BreakLoop) break;
            if (error instanceof ContinueLoop) continue;
            throw error;
          }
        }
      } else {
        for (let i = from; i > to; i += step) {
          this.environment.define(node.variable, i);
          try {
            await this.evaluate(node.body);
          } catch (error) {
            if (error instanceof BreakLoop) break;
            if (error instanceof ContinueLoop) continue;
            throw error;
          }
        }
      }
    } finally {
      this.environment = previous;
    }
    
    return null;
  }

  async evaluateWhile(node) {
    while (await this.evaluate(node.condition)) {
      try {
        await this.evaluate(node.body);
      } catch (error) {
        if (error instanceof BreakLoop) break;
        if (error instanceof ContinueLoop) continue;
        throw error;
      }
    }
    return null;
  }

  async evaluateInput(node) {
    const prompt = node.prompt ? await this.evaluate(node.prompt) : '';
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

module.exports = { Interpreter, Environment, VoxelClass, VoxelInstance };
