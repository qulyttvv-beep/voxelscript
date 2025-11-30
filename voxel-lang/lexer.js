// VoxelScript Lexer - Tokenizes source code

const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  TEMPLATE_STRING: 'TEMPLATE_STRING',
  BOOL: 'BOOL',
  NULL: 'NULL',
  
  // Identifiers & Keywords
  IDENTIFIER: 'IDENTIFIER',
  LET: 'LET',
  CONST: 'CONST',
  FN: 'FN',
  IF: 'IF',
  ELSE: 'ELSE',
  LOOP: 'LOOP',
  WHILE: 'WHILE',
  DO: 'DO',
  FOR: 'FOR',
  IN: 'IN',
  OF: 'OF',
  FROM: 'FROM',
  TO: 'TO',
  STEP: 'STEP',
  RETURN: 'RETURN',
  PRINT: 'PRINT',
  INPUT: 'INPUT',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  BREAK: 'BREAK',
  CONTINUE: 'CONTINUE',
  
  // New keywords
  CLASS: 'CLASS',
  EXTENDS: 'EXTENDS',
  NEW: 'NEW',
  THIS: 'THIS',
  SELF: 'SELF',
  SUPER: 'SUPER',
  STATIC: 'STATIC',
  TRY: 'TRY',
  CATCH: 'CATCH',
  FINALLY: 'FINALLY',
  THROW: 'THROW',
  SWITCH: 'SWITCH',
  MATCH: 'MATCH',
  CASE: 'CASE',
  DEFAULT: 'DEFAULT',
  ASYNC: 'ASYNC',
  AWAIT: 'AWAIT',
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
  AS: 'AS',
  TYPEOF: 'TYPEOF',
  INSTANCEOF: 'INSTANCEOF',
  DELETE: 'DELETE',
  
  // Advanced features - Most wanted by developers
  YIELD: 'YIELD',
  ENUM: 'ENUM',
  WHEN: 'WHEN',
  IS: 'IS',
  WITH: 'WITH',
  LAZY: 'LAZY',
  GET: 'GET',
  SET: 'SET',
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC',
  PROTECTED: 'PROTECTED',
  ABSTRACT: 'ABSTRACT',
  INTERFACE: 'INTERFACE',
  IMPLEMENTS: 'IMPLEMENTS',
  TYPEDEF: 'TYPEDEF',
  ASSERT: 'ASSERT',
  DEBUG: 'DEBUG',
  WHERE: 'WHERE',
  
  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  PERCENT: 'PERCENT',
  POWER: 'POWER',
  ASSIGN: 'ASSIGN',
  PLUS_ASSIGN: 'PLUS_ASSIGN',
  MINUS_ASSIGN: 'MINUS_ASSIGN',
  STAR_ASSIGN: 'STAR_ASSIGN',
  SLASH_ASSIGN: 'SLASH_ASSIGN',
  PERCENT_ASSIGN: 'PERCENT_ASSIGN',
  POWER_ASSIGN: 'POWER_ASSIGN',
  AND_ASSIGN: 'AND_ASSIGN',
  OR_ASSIGN: 'OR_ASSIGN',
  NULLISH_ASSIGN: 'NULLISH_ASSIGN',
  INCREMENT: 'INCREMENT',
  DECREMENT: 'DECREMENT',
  EQ: 'EQ',
  NEQ: 'NEQ',
  LT: 'LT',
  GT: 'GT',
  LTE: 'LTE',
  GTE: 'GTE',
  ARROW: 'ARROW',
  FAT_ARROW: 'FAT_ARROW',
  SPREAD: 'SPREAD',
  RANGE: 'RANGE',
  RANGE_INCLUSIVE: 'RANGE_INCLUSIVE',
  QUESTION: 'QUESTION',
  NULLISH: 'NULLISH',
  OPTIONAL_CHAIN: 'OPTIONAL_CHAIN',
  PIPE: 'PIPE',
  COMPOSE: 'COMPOSE',
  AMPERSAND: 'AMPERSAND',
  BITWISE_AND: 'BITWISE_AND',
  BITWISE_OR: 'BITWISE_OR',
  BITWISE_XOR: 'BITWISE_XOR',
  BITWISE_NOT: 'BITWISE_NOT',
  LEFT_SHIFT: 'LEFT_SHIFT',
  RIGHT_SHIFT: 'RIGHT_SHIFT',
  UNSIGNED_RIGHT_SHIFT: 'UNSIGNED_RIGHT_SHIFT',
  AT: 'AT',
  HASH: 'HASH_OP',
  DOUBLE_COLON: 'DOUBLE_COLON',
  
  // Delimiters
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  COMMA: 'COMMA',
  DOT: 'DOT',
  COLON: 'COLON',
  SEMICOLON: 'SEMICOLON',
  NEWLINE: 'NEWLINE',
  
  EOF: 'EOF'
};

const KEYWORDS = {
  'let': TokenType.LET,
  'const': TokenType.CONST,
  'fn': TokenType.FN,
  'function': TokenType.FN,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'loop': TokenType.LOOP,
  'for': TokenType.FOR,
  'while': TokenType.WHILE,
  'do': TokenType.DO,
  'in': TokenType.IN,
  'of': TokenType.OF,
  'from': TokenType.FROM,
  'to': TokenType.TO,
  'step': TokenType.STEP,
  'return': TokenType.RETURN,
  'print': TokenType.PRINT,
  'input': TokenType.INPUT,
  'true': TokenType.TRUE,
  'false': TokenType.FALSE,
  'and': TokenType.AND,
  'or': TokenType.OR,
  'not': TokenType.NOT,
  'break': TokenType.BREAK,
  'continue': TokenType.CONTINUE,
  'null': TokenType.NULL,
  'nil': TokenType.NULL,
  'none': TokenType.NULL,
  
  // New keywords
  'class': TokenType.CLASS,
  'extends': TokenType.EXTENDS,
  'new': TokenType.NEW,
  'this': TokenType.THIS,
  'self': TokenType.SELF,
  'super': TokenType.SUPER,
  'static': TokenType.STATIC,
  'try': TokenType.TRY,
  'catch': TokenType.CATCH,
  'finally': TokenType.FINALLY,
  'throw': TokenType.THROW,
  'switch': TokenType.SWITCH,
  'match': TokenType.MATCH,
  'case': TokenType.CASE,
  'default': TokenType.DEFAULT,
  'async': TokenType.ASYNC,
  'await': TokenType.AWAIT,
  'import': TokenType.IMPORT,
  'export': TokenType.EXPORT,
  'as': TokenType.AS,
  'typeof': TokenType.TYPEOF,
  'instanceof': TokenType.INSTANCEOF,
  'delete': TokenType.DELETE,
  
  // Advanced features
  'yield': TokenType.YIELD,
  'enum': TokenType.ENUM,
  'when': TokenType.WHEN,
  'is': TokenType.IS,
  'with': TokenType.WITH,
  'lazy': TokenType.LAZY,
  'get': TokenType.GET,
  'set': TokenType.SET,
  'private': TokenType.PRIVATE,
  'public': TokenType.PUBLIC,
  'protected': TokenType.PROTECTED,
  'abstract': TokenType.ABSTRACT,
  'interface': TokenType.INTERFACE,
  'implements': TokenType.IMPLEMENTS,
  'typedef': TokenType.TYPEDEF,
  'assert': TokenType.ASSERT,
  'debug': TokenType.DEBUG,
  'where': TokenType.WHERE
};

class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}

class Lexer {
  constructor(source) {
    this.source = source;
    this.tokens = [];
    this.current = 0;
    this.line = 1;
    this.column = 1;
  }

  tokenize() {
    while (!this.isAtEnd()) {
      this.scanToken();
    }
    this.tokens.push(new Token(TokenType.EOF, null, this.line, this.column));
    return this.tokens;
  }

  scanToken() {
    const char = this.advance();

    switch (char) {
      case '(': this.addToken(TokenType.LPAREN, '('); break;
      case ')': this.addToken(TokenType.RPAREN, ')'); break;
      case '{': this.addToken(TokenType.LBRACE, '{'); break;
      case '}': this.addToken(TokenType.RBRACE, '}'); break;
      case '[': this.addToken(TokenType.LBRACKET, '['); break;
      case ']': this.addToken(TokenType.RBRACKET, ']'); break;
      case ',': this.addToken(TokenType.COMMA, ','); break;
      case ';': this.addToken(TokenType.SEMICOLON, ';'); break;
      case ':': 
        if (this.match(':')) {
          this.addToken(TokenType.DOUBLE_COLON, '::');
        } else {
          this.addToken(TokenType.COLON, ':');
        }
        break;
      case '~': this.addToken(TokenType.BITWISE_NOT, '~'); break;
      case '^': this.addToken(TokenType.BITWISE_XOR, '^'); break;
      case '@': this.addToken(TokenType.AT, '@'); break;
      case '?':
        if (this.match('?')) {
          if (this.match('=')) {
            this.addToken(TokenType.NULLISH_ASSIGN, '??=');
          } else {
            this.addToken(TokenType.NULLISH, '??');
          }
        } else if (this.match('.')) {
          this.addToken(TokenType.OPTIONAL_CHAIN, '?.');
        } else {
          this.addToken(TokenType.QUESTION, '?');
        }
        break;
      case '.':
        if (this.match('.')) {
          if (this.match('.')) {
            this.addToken(TokenType.SPREAD, '...');
          } else if (this.match('=')) {
            this.addToken(TokenType.RANGE_INCLUSIVE, '..=');
          } else {
            this.addToken(TokenType.RANGE, '..');
          }
        } else {
          this.addToken(TokenType.DOT, '.');
        }
        break;
      case '+':
        if (this.match('+')) {
          this.addToken(TokenType.INCREMENT, '++');
        } else if (this.match('=')) {
          this.addToken(TokenType.PLUS_ASSIGN, '+=');
        } else {
          this.addToken(TokenType.PLUS, '+');
        }
        break;
      case '-':
        if (this.match('-')) {
          this.addToken(TokenType.DECREMENT, '--');
        } else if (this.match('=')) {
          this.addToken(TokenType.MINUS_ASSIGN, '-=');
        } else {
          this.addToken(TokenType.MINUS, '-');
        }
        break;
      case '*': 
        if (this.match('*')) {
          if (this.match('=')) {
            this.addToken(TokenType.POWER_ASSIGN, '**=');
          } else {
            this.addToken(TokenType.POWER, '**');
          }
        } else if (this.match('=')) {
          this.addToken(TokenType.STAR_ASSIGN, '*=');
        } else {
          this.addToken(TokenType.STAR, '*');
        }
        break;
      case '/':
        if (this.match('/')) {
          // Comment - skip until end of line
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else if (this.match('*')) {
          // Multi-line comment
          while (!this.isAtEnd()) {
            if (this.peek() === '*' && this.peekNext() === '/') {
              this.advance();
              this.advance();
              break;
            }
            if (this.peek() === '\n') {
              this.line++;
              this.column = 0;
            }
            this.advance();
          }
        } else if (this.match('=')) {
          this.addToken(TokenType.SLASH_ASSIGN, '/=');
        } else {
          this.addToken(TokenType.SLASH, '/');
        }
        break;
      case '%':
        if (this.match('=')) {
          this.addToken(TokenType.PERCENT_ASSIGN, '%=');
        } else {
          this.addToken(TokenType.PERCENT, '%');
        }
        break;
      case '&':
        if (this.match('&')) {
          if (this.match('=')) {
            this.addToken(TokenType.AND_ASSIGN, '&&=');
          } else {
            this.addToken(TokenType.AND, '&&');
          }
        } else {
          this.addToken(TokenType.BITWISE_AND, '&');
        }
        break;
      case '|':
        if (this.match('|')) {
          if (this.match('=')) {
            this.addToken(TokenType.OR_ASSIGN, '||=');
          } else {
            this.addToken(TokenType.OR, '||');
          }
        } else if (this.match('>')) {
          this.addToken(TokenType.PIPE, '|>');
        } else {
          this.addToken(TokenType.BITWISE_OR, '|');
        }
        break;
      case '=':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addToken(TokenType.EQ, '===');
          } else {
            this.addToken(TokenType.EQ, '==');
          }
        } else if (this.match('>')) {
          this.addToken(TokenType.ARROW, '=>');
        } else {
          this.addToken(TokenType.ASSIGN, '=');
        }
        break;
      case '!':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addToken(TokenType.NEQ, '!==');
          } else {
            this.addToken(TokenType.NEQ, '!=');
          }
        } else {
          this.addToken(TokenType.NOT, '!');
        }
        break;
      case '<':
        if (this.match('<')) {
          this.addToken(TokenType.LEFT_SHIFT, '<<');
        } else if (this.match('=')) {
          this.addToken(TokenType.LTE, '<=');
        } else {
          this.addToken(TokenType.LT, '<');
        }
        break;
      case '>':
        if (this.match('>')) {
          if (this.match('>')) {
            this.addToken(TokenType.UNSIGNED_RIGHT_SHIFT, '>>>');
          } else {
            this.addToken(TokenType.RIGHT_SHIFT, '>>');
          }
        } else if (this.match('=')) {
          this.addToken(TokenType.GTE, '>=');
        } else {
          this.addToken(TokenType.GT, '>');
        }
        break;
      case '"':
      case "'":
        this.string(char);
        break;
      case '`':
        this.templateString();
        break;
      case '#':
        // Hash comment - skip until end of line
        while (this.peek() !== '\n' && !this.isAtEnd()) {
          this.advance();
        }
        break;
      case '\n':
        this.addToken(TokenType.NEWLINE, '\n');
        this.line++;
        this.column = 1;
        break;
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break;
      default:
        if (this.isDigit(char)) {
          this.number(char);
        } else if (this.isAlpha(char)) {
          this.identifier(char);
        } else {
          throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
        }
    }
  }

  templateString() {
    let value = '';
    let parts = [];
    let currentStr = '';
    
    while (this.peek() !== '`' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
        currentStr += '\n';
        this.advance();
      } else if (this.peek() === '$' && this.peekNext() === '{') {
        // Template interpolation
        if (currentStr) {
          parts.push({ type: 'string', value: currentStr });
          currentStr = '';
        }
        this.advance(); // $
        this.advance(); // {
        
        // Collect expression until }
        let expr = '';
        let braceCount = 1;
        while (braceCount > 0 && !this.isAtEnd()) {
          if (this.peek() === '{') braceCount++;
          if (this.peek() === '}') braceCount--;
          if (braceCount > 0) {
            expr += this.advance();
          }
        }
        this.advance(); // }
        parts.push({ type: 'expr', value: expr });
      } else if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n': currentStr += '\n'; break;
          case 't': currentStr += '\t'; break;
          case 'r': currentStr += '\r'; break;
          case '\\': currentStr += '\\'; break;
          case '`': currentStr += '`'; break;
          case '$': currentStr += '$'; break;
          default: currentStr += escaped;
        }
      } else {
        currentStr += this.advance();
      }
    }
    
    if (this.isAtEnd()) {
      throw new Error(`Unterminated template string at line ${this.line}`);
    }
    this.advance(); // Closing `
    
    if (currentStr) {
      parts.push({ type: 'string', value: currentStr });
    }
    
    this.addToken(TokenType.TEMPLATE_STRING, parts);
  }

  string(quote) {
    let value = '';
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          case '0': value += '\0'; break;
          case 'x': {
            // Hex escape \xNN
            const hex = this.advance() + this.advance();
            value += String.fromCharCode(parseInt(hex, 16));
            break;
          }
          case 'u': {
            // Unicode escape \uNNNN
            const unicode = this.advance() + this.advance() + this.advance() + this.advance();
            value += String.fromCharCode(parseInt(unicode, 16));
            break;
          }
          default: value += escaped;
        }
      } else {
        value += this.advance();
      }
    }
    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${this.line}`);
    }
    this.advance(); // Closing quote
    this.addToken(TokenType.STRING, value);
  }

  number(first) {
    let value = first;
    
    // Check for hex, binary, octal
    if (first === '0') {
      if (this.peek() === 'x' || this.peek() === 'X') {
        value += this.advance();
        while (this.isHexDigit(this.peek())) {
          value += this.advance();
        }
        this.addToken(TokenType.NUMBER, parseInt(value, 16));
        return;
      } else if (this.peek() === 'b' || this.peek() === 'B') {
        value += this.advance();
        while (this.peek() === '0' || this.peek() === '1') {
          value += this.advance();
        }
        this.addToken(TokenType.NUMBER, parseInt(value.slice(2), 2));
        return;
      } else if (this.peek() === 'o' || this.peek() === 'O') {
        value += this.advance();
        while (this.peek() >= '0' && this.peek() <= '7') {
          value += this.advance();
        }
        this.addToken(TokenType.NUMBER, parseInt(value.slice(2), 8));
        return;
      }
    }
    
    while (this.isDigit(this.peek()) || this.peek() === '_') {
      if (this.peek() !== '_') value += this.advance();
      else this.advance();
    }
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      value += this.advance(); // .
      while (this.isDigit(this.peek()) || this.peek() === '_') {
        if (this.peek() !== '_') value += this.advance();
        else this.advance();
      }
    }
    // Scientific notation
    if (this.peek() === 'e' || this.peek() === 'E') {
      value += this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        value += this.advance();
      }
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }
    this.addToken(TokenType.NUMBER, parseFloat(value));
  }

  isHexDigit(char) {
    return this.isDigit(char) || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F');
  }

  identifier(first) {
    let value = first;
    while (this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    const type = Object.prototype.hasOwnProperty.call(KEYWORDS, value) ? KEYWORDS[value] : TokenType.IDENTIFIER;
    this.addToken(type, value);
  }

  advance() {
    const char = this.source[this.current];
    this.current++;
    this.column++;
    return char;
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  isDigit(char) {
    return char >= '0' && char <= '9';
  }

  isAlpha(char) {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  isAlphaNumeric(char) {
    return this.isAlpha(char) || this.isDigit(char);
  }

  addToken(type, value) {
    this.tokens.push(new Token(type, value, this.line, this.column));
  }
}

module.exports = { Lexer, Token, TokenType };
