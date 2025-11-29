// VoxelScript Parser - Creates Abstract Syntax Tree

const { TokenType } = require('./lexer');

// AST Node Types
class ASTNode {
  constructor(type) {
    this.type = type;
  }
}

class Program extends ASTNode {
  constructor(statements) {
    super('Program');
    this.statements = statements;
  }
}

class NumberLiteral extends ASTNode {
  constructor(value) {
    super('NumberLiteral');
    this.value = value;
  }
}

class StringLiteral extends ASTNode {
  constructor(value) {
    super('StringLiteral');
    this.value = value;
  }
}

class BoolLiteral extends ASTNode {
  constructor(value) {
    super('BoolLiteral');
    this.value = value;
  }
}

class NullLiteral extends ASTNode {
  constructor() {
    super('NullLiteral');
    this.value = null;
  }
}

class ArrayLiteral extends ASTNode {
  constructor(elements) {
    super('ArrayLiteral');
    this.elements = elements;
  }
}

class ObjectLiteral extends ASTNode {
  constructor(properties) {
    super('ObjectLiteral');
    this.properties = properties;
  }
}

class Identifier extends ASTNode {
  constructor(name) {
    super('Identifier');
    this.name = name;
  }
}

class BinaryExpr extends ASTNode {
  constructor(left, operator, right) {
    super('BinaryExpr');
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

class UnaryExpr extends ASTNode {
  constructor(operator, operand) {
    super('UnaryExpr');
    this.operator = operator;
    this.operand = operand;
  }
}

class LetDeclaration extends ASTNode {
  constructor(name, value) {
    super('LetDeclaration');
    this.name = name;
    this.value = value;
  }
}

class Assignment extends ASTNode {
  constructor(target, value) {
    super('Assignment');
    this.target = target;
    this.value = value;
  }
}

class FunctionDeclaration extends ASTNode {
  constructor(name, params, body) {
    super('FunctionDeclaration');
    this.name = name;
    this.params = params;
    this.body = body;
  }
}

class FunctionCall extends ASTNode {
  constructor(callee, args) {
    super('FunctionCall');
    this.callee = callee;
    this.args = args;
  }
}

class IfStatement extends ASTNode {
  constructor(condition, thenBranch, elseBranch) {
    super('IfStatement');
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }
}

class LoopStatement extends ASTNode {
  constructor(variable, from, to, body) {
    super('LoopStatement');
    this.variable = variable;
    this.from = from;
    this.to = to;
    this.body = body;
  }
}

class WhileStatement extends ASTNode {
  constructor(condition, body) {
    super('WhileStatement');
    this.condition = condition;
    this.body = body;
  }
}

class ReturnStatement extends ASTNode {
  constructor(value) {
    super('ReturnStatement');
    this.value = value;
  }
}

class BreakStatement extends ASTNode {
  constructor() {
    super('BreakStatement');
  }
}

class ContinueStatement extends ASTNode {
  constructor() {
    super('ContinueStatement');
  }
}

class PrintStatement extends ASTNode {
  constructor(value) {
    super('PrintStatement');
    this.value = value;
  }
}

class InputExpr extends ASTNode {
  constructor(prompt) {
    super('InputExpr');
    this.prompt = prompt;
  }
}

class IndexAccess extends ASTNode {
  constructor(object, index) {
    super('IndexAccess');
    this.object = object;
    this.index = index;
  }
}

class MemberAccess extends ASTNode {
  constructor(object, property) {
    super('MemberAccess');
    this.object = object;
    this.property = property;
  }
}

class Block extends ASTNode {
  constructor(statements) {
    super('Block');
    this.statements = statements;
  }
}

// Parser
class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== TokenType.NEWLINE); // Remove newlines for simpler parsing
    this.current = 0;
  }

  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) statements.push(stmt);
    }
    return new Program(statements);
  }

  declaration() {
    if (this.match(TokenType.LET)) return this.letDeclaration();
    if (this.match(TokenType.FN)) return this.functionDeclaration();
    return this.statement();
  }

  letDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name");
    let value = null;
    if (this.match(TokenType.ASSIGN)) {
      value = this.expression();
    }
    return new LetDeclaration(name.value, value);
  }

  functionDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name");
    this.consume(TokenType.LPAREN, "Expected '(' after function name");
    
    const params = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name").value);
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    
    this.consume(TokenType.LBRACE, "Expected '{' before function body");
    const body = this.block();
    
    return new FunctionDeclaration(name.value, params, body);
  }

  statement() {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.LOOP)) return this.loopStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.BREAK)) return new BreakStatement();
    if (this.match(TokenType.CONTINUE)) return new ContinueStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.LBRACE)) return this.block();
    return this.expressionStatement();
  }

  ifStatement() {
    const condition = this.expression();
    this.consume(TokenType.LBRACE, "Expected '{' after if condition");
    const thenBranch = this.block();
    
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      if (this.match(TokenType.IF)) {
        elseBranch = this.ifStatement();
      } else {
        this.consume(TokenType.LBRACE, "Expected '{' after else");
        elseBranch = this.block();
      }
    }
    
    return new IfStatement(condition, thenBranch, elseBranch);
  }

  loopStatement() {
    const variable = this.consume(TokenType.IDENTIFIER, "Expected loop variable");
    this.consume(TokenType.FROM, "Expected 'from' in loop");
    const from = this.expression();
    this.consume(TokenType.TO, "Expected 'to' in loop");
    const to = this.expression();
    this.consume(TokenType.LBRACE, "Expected '{' before loop body");
    const body = this.block();
    
    return new LoopStatement(variable.value, from, to, body);
  }

  whileStatement() {
    const condition = this.expression();
    this.consume(TokenType.LBRACE, "Expected '{' after while condition");
    const body = this.block();
    return new WhileStatement(condition, body);
  }

  returnStatement() {
    let value = null;
    if (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Check if next token could start an expression
      if (!this.check(TokenType.LET) && !this.check(TokenType.FN) && 
          !this.check(TokenType.IF) && !this.check(TokenType.LOOP) &&
          !this.check(TokenType.WHILE) && !this.check(TokenType.RETURN)) {
        value = this.expression();
      }
    }
    return new ReturnStatement(value);
  }

  printStatement() {
    const value = this.expression();
    return new PrintStatement(value);
  }

  block() {
    const statements = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.RBRACE, "Expected '}' after block");
    return new Block(statements);
  }

  expressionStatement() {
    const expr = this.expression();
    
    // Check for assignment
    if (this.match(TokenType.ASSIGN)) {
      const value = this.expression();
      return new Assignment(expr, value);
    }
    
    return expr;
  }

  expression() {
    return this.or();
  }

  or() {
    let expr = this.and();
    while (this.match(TokenType.OR)) {
      const right = this.and();
      expr = new BinaryExpr(expr, 'or', right);
    }
    return expr;
  }

  and() {
    let expr = this.equality();
    while (this.match(TokenType.AND)) {
      const right = this.equality();
      expr = new BinaryExpr(expr, 'and', right);
    }
    return expr;
  }

  equality() {
    let expr = this.comparison();
    while (this.match(TokenType.EQ, TokenType.NEQ)) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = new BinaryExpr(expr, operator, right);
    }
    return expr;
  }

  comparison() {
    let expr = this.term();
    while (this.match(TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE)) {
      const operator = this.previous().value;
      const right = this.term();
      expr = new BinaryExpr(expr, operator, right);
    }
    return expr;
  }

  term() {
    let expr = this.factor();
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = new BinaryExpr(expr, operator, right);
    }
    return expr;
  }

  factor() {
    let expr = this.power();
    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.previous().value;
      const right = this.power();
      expr = new BinaryExpr(expr, operator, right);
    }
    return expr;
  }

  power() {
    let expr = this.unary();
    if (this.match(TokenType.POWER)) {
      const right = this.power(); // Right associative
      expr = new BinaryExpr(expr, '**', right);
    }
    return expr;
  }

  unary() {
    if (this.match(TokenType.MINUS, TokenType.NOT)) {
      const operator = this.previous().value;
      const operand = this.unary();
      return new UnaryExpr(operator, operand);
    }
    return this.call();
  }

  call() {
    let expr = this.primary();
    
    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.expression();
        this.consume(TokenType.RBRACKET, "Expected ']' after index");
        expr = new IndexAccess(expr, index);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(TokenType.IDENTIFIER, "Expected property name after '.'");
        expr = new MemberAccess(expr, name.value);
      } else {
        break;
      }
    }
    
    return expr;
  }

  finishCall(callee) {
    const args = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "Expected ')' after arguments");
    return new FunctionCall(callee, args);
  }

  primary() {
    if (this.match(TokenType.NUMBER)) {
      return new NumberLiteral(this.previous().value);
    }
    
    if (this.match(TokenType.STRING)) {
      return new StringLiteral(this.previous().value);
    }
    
    if (this.match(TokenType.TRUE)) {
      return new BoolLiteral(true);
    }
    
    if (this.match(TokenType.FALSE)) {
      return new BoolLiteral(false);
    }
    
    if (this.match(TokenType.NULL)) {
      return new NullLiteral();
    }
    
    if (this.match(TokenType.INPUT)) {
      this.consume(TokenType.LPAREN, "Expected '(' after input");
      let prompt = null;
      if (!this.check(TokenType.RPAREN)) {
        prompt = this.expression();
      }
      this.consume(TokenType.RPAREN, "Expected ')' after input prompt");
      return new InputExpr(prompt);
    }
    
    if (this.match(TokenType.IDENTIFIER)) {
      return new Identifier(this.previous().value);
    }
    
    if (this.match(TokenType.LBRACKET)) {
      const elements = [];
      if (!this.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after array elements");
      return new ArrayLiteral(elements);
    }
    
    if (this.match(TokenType.LBRACE)) {
      const properties = {};
      if (!this.check(TokenType.RBRACE)) {
        do {
          const key = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
          this.consume(TokenType.COLON, "Expected ':' after property name");
          const value = this.expression();
          properties[key] = value;
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACE, "Expected '}' after object properties");
      return new ObjectLiteral(properties);
    }
    
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }
    
    throw new Error(`Unexpected token: ${this.peek().type} at line ${this.peek().line}`);
  }

  // Helper methods
  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    throw new Error(`${message}. Got ${this.peek().type} at line ${this.peek().line}`);
  }
}

module.exports = {
  Parser,
  Program,
  NumberLiteral,
  StringLiteral,
  BoolLiteral,
  NullLiteral,
  ArrayLiteral,
  ObjectLiteral,
  Identifier,
  BinaryExpr,
  UnaryExpr,
  LetDeclaration,
  Assignment,
  FunctionDeclaration,
  FunctionCall,
  IfStatement,
  LoopStatement,
  WhileStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  PrintStatement,
  InputExpr,
  IndexAccess,
  MemberAccess,
  Block
};
