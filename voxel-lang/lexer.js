// VoxelScript Lexer - Tokenizes source code

const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  BOOL: 'BOOL',
  NULL: 'NULL',
  
  // Identifiers & Keywords
  IDENTIFIER: 'IDENTIFIER',
  LET: 'LET',
  FN: 'FN',
  IF: 'IF',
  ELSE: 'ELSE',
  LOOP: 'LOOP',
  WHILE: 'WHILE',
  FROM: 'FROM',
  TO: 'TO',
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
  
  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  PERCENT: 'PERCENT',
  POWER: 'POWER',
  ASSIGN: 'ASSIGN',
  EQ: 'EQ',
  NEQ: 'NEQ',
  LT: 'LT',
  GT: 'GT',
  LTE: 'LTE',
  GTE: 'GTE',
  
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
  NEWLINE: 'NEWLINE',
  
  EOF: 'EOF'
};

const KEYWORDS = {
  'let': TokenType.LET,
  'fn': TokenType.FN,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'loop': TokenType.LOOP,
  'while': TokenType.WHILE,
  'from': TokenType.FROM,
  'to': TokenType.TO,
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
  'null': TokenType.NULL
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
      case '.': this.addToken(TokenType.DOT, '.'); break;
      case ':': this.addToken(TokenType.COLON, ':'); break;
      case '+': this.addToken(TokenType.PLUS, '+'); break;
      case '-': this.addToken(TokenType.MINUS, '-'); break;
      case '*': 
        if (this.match('*')) {
          this.addToken(TokenType.POWER, '**');
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
        } else {
          this.addToken(TokenType.SLASH, '/');
        }
        break;
      case '%': this.addToken(TokenType.PERCENT, '%'); break;
      case '=':
        if (this.match('=')) {
          this.addToken(TokenType.EQ, '==');
        } else {
          this.addToken(TokenType.ASSIGN, '=');
        }
        break;
      case '!':
        if (this.match('=')) {
          this.addToken(TokenType.NEQ, '!=');
        } else {
          this.addToken(TokenType.NOT, '!');
        }
        break;
      case '<':
        if (this.match('=')) {
          this.addToken(TokenType.LTE, '<=');
        } else {
          this.addToken(TokenType.LT, '<');
        }
        break;
      case '>':
        if (this.match('=')) {
          this.addToken(TokenType.GTE, '>=');
        } else {
          this.addToken(TokenType.GT, '>');
        }
        break;
      case '"':
      case "'":
        this.string(char);
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
    while (this.isDigit(this.peek())) {
      value += this.advance();
    }
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      value += this.advance(); // .
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }
    this.addToken(TokenType.NUMBER, parseFloat(value));
  }

  identifier(first) {
    let value = first;
    while (this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    const type = KEYWORDS[value] || TokenType.IDENTIFIER;
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
