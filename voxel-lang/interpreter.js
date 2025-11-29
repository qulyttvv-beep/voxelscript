// VoxelScript Interpreter - Executes the AST

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

// Environment for variable scoping
class Environment {
  constructor(parent = null) {
    this.variables = new Map();
    this.parent = parent;
  }

  define(name, value) {
    this.variables.set(name, value);
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
};

class Interpreter {
  constructor() {
    this.global = new Environment();
    this.environment = this.global;
    this.inputQueue = [];
    this.inputResolver = null;
    
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
    switch (node.type) {
      case 'Program':
        return this.run(node);
        
      case 'NumberLiteral':
        return node.value;
        
      case 'StringLiteral':
        return node.value;
        
      case 'BoolLiteral':
        return node.value;
        
      case 'NullLiteral':
        return null;
        
      case 'ArrayLiteral': {
        const elements = [];
        for (const el of node.elements) {
          elements.push(await this.evaluate(el));
        }
        return elements;
      }
        
      case 'ObjectLiteral': {
        const obj = {};
        for (const [key, value] of Object.entries(node.properties)) {
          obj[key] = await this.evaluate(value);
        }
        return obj;
      }
        
      case 'Identifier':
        return this.environment.get(node.name);
        
      case 'BinaryExpr':
        return this.evaluateBinary(node);
        
      case 'UnaryExpr':
        return this.evaluateUnary(node);
        
      case 'LetDeclaration': {
        const value = node.value ? await this.evaluate(node.value) : null;
        this.environment.define(node.name, value);
        return value;
      }
        
      case 'Assignment': {
        const value = await this.evaluate(node.value);
        
        if (node.target.type === 'Identifier') {
          this.environment.set(node.target.name, value);
        } else if (node.target.type === 'IndexAccess') {
          const obj = await this.evaluate(node.target.object);
          const index = await this.evaluate(node.target.index);
          obj[index] = value;
        } else if (node.target.type === 'MemberAccess') {
          const obj = await this.evaluate(node.target.object);
          obj[node.target.property] = value;
        }
        return value;
      }
        
      case 'FunctionDeclaration': {
        const fn = {
          __isVoxelFunction: true,
          params: node.params,
          body: node.body,
          closure: this.environment
        };
        this.environment.define(node.name, fn);
        return fn;
      }
        
      case 'FunctionCall':
        return this.evaluateCall(node);
        
      case 'IfStatement':
        return this.evaluateIf(node);
        
      case 'LoopStatement':
        return this.evaluateLoop(node);
        
      case 'WhileStatement':
        return this.evaluateWhile(node);
        
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
        
      case 'IndexAccess': {
        const obj = await this.evaluate(node.object);
        const index = await this.evaluate(node.index);
        return obj[index];
      }
        
      case 'MemberAccess': {
        const obj = await this.evaluate(node.object);
        return obj[node.property];
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
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
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
      default:
        throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  async evaluateCall(node) {
    const callee = await this.evaluate(node.callee);
    const args = [];
    for (const arg of node.args) {
      args.push(await this.evaluate(arg));
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
      // User-defined function
      const previous = this.environment;
      this.environment = new Environment(callee.closure);
      
      // Bind parameters
      for (let i = 0; i < callee.params.length; i++) {
        this.environment.define(callee.params[i], args[i] ?? null);
      }
      
      try {
        for (const stmt of callee.body.statements) {
          await this.evaluate(stmt);
        }
      } catch (error) {
        if (error instanceof ReturnValue) {
          return error.value;
        }
        throw error;
      } finally {
        this.environment = previous;
      }
      
      return null;
    }
    
    throw new Error(`${callee} is not a function`);
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
    
    const previous = this.environment;
    this.environment = new Environment(previous);
    
    try {
      for (let i = from; i < to; i++) {
        this.environment.define(node.variable, i);
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

module.exports = { Interpreter, Environment };
