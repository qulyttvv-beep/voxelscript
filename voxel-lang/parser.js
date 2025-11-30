// VoxelScript Parser - Creates Abstract Syntax Tree
// Supports: classes, async/await, try-catch, switch, arrow functions, destructuring, spread, and more

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

class TemplateLiteral extends ASTNode {
  constructor(parts) {
    super('TemplateLiteral');
    this.parts = parts; // Array of {type: 'string'|'expression', value: string|ASTNode}
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

class SpreadElement extends ASTNode {
  constructor(argument) {
    super('SpreadElement');
    this.argument = argument;
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
  constructor(operator, operand, prefix = true) {
    super('UnaryExpr');
    this.operator = operator;
    this.operand = operand;
    this.prefix = prefix;
  }
}

class UpdateExpr extends ASTNode {
  constructor(operator, operand, prefix) {
    super('UpdateExpr');
    this.operator = operator;
    this.operand = operand;
    this.prefix = prefix;
  }
}

class LetDeclaration extends ASTNode {
  constructor(name, value, isConst = false) {
    super('LetDeclaration');
    this.name = name;
    this.value = value;
    this.isConst = isConst;
  }
}

class DestructuringDeclaration extends ASTNode {
  constructor(pattern, value, isArray, isConst = false) {
    super('DestructuringDeclaration');
    this.pattern = pattern;
    this.value = value;
    this.isArray = isArray;
    this.isConst = isConst;
  }
}

class Assignment extends ASTNode {
  constructor(target, value, operator = '=') {
    super('Assignment');
    this.target = target;
    this.value = value;
    this.operator = operator;
  }
}

class TernaryExpr extends ASTNode {
  constructor(condition, consequent, alternate) {
    super('TernaryExpr');
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }
}

class NullishCoalescing extends ASTNode {
  constructor(left, right) {
    super('NullishCoalescing');
    this.left = left;
    this.right = right;
  }
}

class OptionalChain extends ASTNode {
  constructor(object, property, computed = false) {
    super('OptionalChain');
    this.object = object;
    this.property = property;
    this.computed = computed;
  }
}

class PipeExpr extends ASTNode {
  constructor(left, right) {
    super('PipeExpr');
    this.left = left;
    this.right = right;
  }
}

class FunctionDeclaration extends ASTNode {
  constructor(name, params, body, isAsync = false) {
    super('FunctionDeclaration');
    this.name = name;
    this.params = params;
    this.body = body;
    this.isAsync = isAsync;
  }
}

class ArrowFunction extends ASTNode {
  constructor(params, body, isAsync = false) {
    super('ArrowFunction');
    this.params = params;
    this.body = body;
    this.isAsync = isAsync;
  }
}

class FunctionCall extends ASTNode {
  constructor(callee, args) {
    super('FunctionCall');
    this.callee = callee;
    this.args = args;
  }
}

class NewExpr extends ASTNode {
  constructor(callee, args) {
    super('NewExpr');
    this.callee = callee;
    this.args = args;
  }
}

class AwaitExpr extends ASTNode {
  constructor(argument) {
    super('AwaitExpr');
    this.argument = argument;
  }
}

class ClassDeclaration extends ASTNode {
  constructor(name, superClass, body) {
    super('ClassDeclaration');
    this.name = name;
    this.superClass = superClass;
    this.body = body;
  }
}

class MethodDefinition extends ASTNode {
  constructor(key, params, body, isStatic = false, isAsync = false, kind = 'method') {
    super('MethodDefinition');
    this.key = key;
    this.params = params;
    this.body = body;
    this.isStatic = isStatic;
    this.isAsync = isAsync;
    this.kind = kind; // 'method', 'constructor', 'getter', 'setter'
  }
}

class PropertyDefinition extends ASTNode {
  constructor(key, value, isStatic = false) {
    super('PropertyDefinition');
    this.key = key;
    this.value = value;
    this.isStatic = isStatic;
  }
}

class ThisExpr extends ASTNode {
  constructor() {
    super('ThisExpr');
  }
}

class SuperExpr extends ASTNode {
  constructor() {
    super('SuperExpr');
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

class SwitchStatement extends ASTNode {
  constructor(discriminant, cases) {
    super('SwitchStatement');
    this.discriminant = discriminant;
    this.cases = cases;
  }
}

class SwitchCase extends ASTNode {
  constructor(test, consequent) {
    super('SwitchCase');
    this.test = test; // null for default
    this.consequent = consequent;
  }
}

class LoopStatement extends ASTNode {
  constructor(variable, from, to, body, step = null) {
    super('LoopStatement');
    this.variable = variable;
    this.from = from;
    this.to = to;
    this.body = body;
    this.step = step;
  }
}

class ForInStatement extends ASTNode {
  constructor(variable, iterable, body) {
    super('ForInStatement');
    this.variable = variable;
    this.iterable = iterable;
    this.body = body;
  }
}

class ForOfStatement extends ASTNode {
  constructor(variable, iterable, body) {
    super('ForOfStatement');
    this.variable = variable;
    this.iterable = iterable;
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

class DoWhileStatement extends ASTNode {
  constructor(body, condition) {
    super('DoWhileStatement');
    this.body = body;
    this.condition = condition;
  }
}

class TryStatement extends ASTNode {
  constructor(block, handler, finalizer) {
    super('TryStatement');
    this.block = block;
    this.handler = handler; // { param, body }
    this.finalizer = finalizer;
  }
}

class ThrowStatement extends ASTNode {
  constructor(argument) {
    super('ThrowStatement');
    this.argument = argument;
  }
}

class ReturnStatement extends ASTNode {
  constructor(value) {
    super('ReturnStatement');
    this.value = value;
  }
}

class BreakStatement extends ASTNode {
  constructor(label = null) {
    super('BreakStatement');
    this.label = label;
  }
}

class ContinueStatement extends ASTNode {
  constructor(label = null) {
    super('ContinueStatement');
    this.label = label;
  }
}

class LabeledStatement extends ASTNode {
  constructor(label, body) {
    super('LabeledStatement');
    this.label = label;
    this.body = body;
  }
}

class ImportStatement extends ASTNode {
  constructor(specifiers, source) {
    super('ImportStatement');
    this.specifiers = specifiers;
    this.source = source;
  }
}

class ExportStatement extends ASTNode {
  constructor(declaration, specifiers, source, isDefault = false) {
    super('ExportStatement');
    this.declaration = declaration;
    this.specifiers = specifiers;
    this.source = source;
    this.isDefault = isDefault;
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

class TypeOfExpr extends ASTNode {
  constructor(argument) {
    super('TypeOfExpr');
    this.argument = argument;
  }
}

class InstanceOfExpr extends ASTNode {
  constructor(left, right) {
    super('InstanceOfExpr');
    this.left = left;
    this.right = right;
  }
}

class DeleteExpr extends ASTNode {
  constructor(argument) {
    super('DeleteExpr');
    this.argument = argument;
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

// ===== ADVANCED FEATURES - Most Wanted by Developers =====

// Generator Functions (yield)
class GeneratorDeclaration extends ASTNode {
  constructor(name, params, body) {
    super('GeneratorDeclaration');
    this.name = name;
    this.params = params;
    this.body = body;
  }
}

class YieldExpr extends ASTNode {
  constructor(argument, delegate = false) {
    super('YieldExpr');
    this.argument = argument;
    this.delegate = delegate; // yield* for delegation
  }
}

// Enums
class EnumDeclaration extends ASTNode {
  constructor(name, members) {
    super('EnumDeclaration');
    this.name = name;
    this.members = members; // [{name, value}]
  }
}

// Pattern Matching with Guards
class MatchExpr extends ASTNode {
  constructor(discriminant, arms) {
    super('MatchExpr');
    this.discriminant = discriminant;
    this.arms = arms; // [{pattern, guard, body}]
  }
}

class MatchArm extends ASTNode {
  constructor(pattern, guard, body) {
    super('MatchArm');
    this.pattern = pattern;
    this.guard = guard; // optional 'when' condition
    this.body = body;
  }
}

class WildcardPattern extends ASTNode {
  constructor() {
    super('WildcardPattern');
  }
}

class LiteralPattern extends ASTNode {
  constructor(value) {
    super('LiteralPattern');
    this.value = value;
  }
}

class RangePattern extends ASTNode {
  constructor(start, end, inclusive = false) {
    super('RangePattern');
    this.start = start;
    this.end = end;
    this.inclusive = inclusive;
  }
}

class ArrayPattern extends ASTNode {
  constructor(elements) {
    super('ArrayPattern');
    this.elements = elements;
  }
}

class ObjectPattern extends ASTNode {
  constructor(properties) {
    super('ObjectPattern');
    this.properties = properties;
  }
}

class OrPattern extends ASTNode {
  constructor(patterns) {
    super('OrPattern');
    this.patterns = patterns;
  }
}

class BindingPattern extends ASTNode {
  constructor(name) {
    super('BindingPattern');
    this.name = name;
  }
}

class TypePattern extends ASTNode {
  constructor(typeName) {
    super('TypePattern');
    this.typeName = typeName;
  }
}

// Range Expression (1..10, 1..=10)
class RangeExpr extends ASTNode {
  constructor(start, end, inclusive = false) {
    super('RangeExpr');
    this.start = start;
    this.end = end;
    this.inclusive = inclusive;
  }
}

// Decorators (@decorator)
class DecoratorExpr extends ASTNode {
  constructor(name, args) {
    super('DecoratorExpr');
    this.name = name;
    this.args = args;
  }
}

class DecoratedDeclaration extends ASTNode {
  constructor(decorators, declaration) {
    super('DecoratedDeclaration');
    this.decorators = decorators;
    this.declaration = declaration;
  }
}

// Type Annotations (optional typing)
class TypeAnnotation extends ASTNode {
  constructor(name, nullable = false, generic = null) {
    super('TypeAnnotation');
    this.name = name; // 'string', 'number', 'bool', 'array', 'object', etc.
    this.nullable = nullable;
    this.generic = generic; // Array<number>
  }
}

class TypedDeclaration extends ASTNode {
  constructor(name, typeAnnotation, value, isConst = false) {
    super('TypedDeclaration');
    this.name = name;
    this.typeAnnotation = typeAnnotation;
    this.value = value;
    this.isConst = isConst;
  }
}

// Interface Declaration
class InterfaceDeclaration extends ASTNode {
  constructor(name, members, extends_) {
    super('InterfaceDeclaration');
    this.name = name;
    this.members = members;
    this.extends = extends_;
  }
}

// Type Alias
class TypeAliasDeclaration extends ASTNode {
  constructor(name, typeDefinition) {
    super('TypeAliasDeclaration');
    this.name = name;
    this.typeDefinition = typeDefinition;
  }
}

// Assert Statement
class AssertStatement extends ASTNode {
  constructor(condition, message) {
    super('AssertStatement');
    this.condition = condition;
    this.message = message;
  }
}

// Debug Statement
class DebugStatement extends ASTNode {
  constructor(expression) {
    super('DebugStatement');
    this.expression = expression;
  }
}

// Comprehension (list/dict)
class ListComprehension extends ASTNode {
  constructor(element, variable, iterable, condition) {
    super('ListComprehension');
    this.element = element;
    this.variable = variable;
    this.iterable = iterable;
    this.condition = condition; // optional filter
  }
}

class DictComprehension extends ASTNode {
  constructor(key, value, variable, iterable, condition) {
    super('DictComprehension');
    this.key = key;
    this.value = value;
    this.variable = variable;
    this.iterable = iterable;
    this.condition = condition;
  }
}

// Lazy Evaluation
class LazyExpr extends ASTNode {
  constructor(expression) {
    super('LazyExpr');
    this.expression = expression;
  }
}

// Method Chaining Support
class ChainExpr extends ASTNode {
  constructor(object, calls) {
    super('ChainExpr');
    this.object = object;
    this.calls = calls;
  }
}

// Getter/Setter Properties
class GetterDeclaration extends ASTNode {
  constructor(name, body, isStatic = false) {
    super('GetterDeclaration');
    this.name = name;
    this.body = body;
    this.isStatic = isStatic;
  }
}

class SetterDeclaration extends ASTNode {
  constructor(name, param, body, isStatic = false) {
    super('SetterDeclaration');
    this.name = name;
    this.param = param;
    this.body = body;
    this.isStatic = isStatic;
  }
}

// With Statement (context manager like Python)
class WithStatement extends ASTNode {
  constructor(object, alias, body) {
    super('WithStatement');
    this.object = object;
    this.alias = alias;
    this.body = body;
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
    // Handle decorators
    if (this.check(TokenType.AT)) {
      return this.decoratedDeclaration();
    }
    if (this.match(TokenType.LET)) return this.letDeclaration(false);
    if (this.match(TokenType.CONST)) return this.letDeclaration(true);
    if (this.match(TokenType.FN)) return this.functionDeclaration(false);
    if (this.match(TokenType.ASYNC)) {
      if (this.match(TokenType.FN)) {
        return this.functionDeclaration(true);
      }
      // async generator
      if (this.check(TokenType.STAR)) {
        return this.generatorDeclaration(true);
      }
    }
    if (this.match(TokenType.STAR)) return this.generatorDeclaration(false);
    if (this.match(TokenType.CLASS)) return this.classDeclaration();
    if (this.match(TokenType.ENUM)) return this.enumDeclaration();
    if (this.match(TokenType.INTERFACE)) return this.interfaceDeclaration();
    if (this.match(TokenType.TYPEDEF)) return this.typeAliasDeclaration();
    if (this.match(TokenType.IMPORT)) return this.importStatement();
    if (this.match(TokenType.EXPORT)) return this.exportStatement();
    return this.statement();
  }

  // Decorator support (@decorator)
  decoratedDeclaration() {
    const decorators = [];
    while (this.match(TokenType.AT)) {
      const name = this.consume(TokenType.IDENTIFIER, "Expected decorator name");
      let args = [];
      if (this.match(TokenType.LPAREN)) {
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, "Expected ')' after decorator arguments");
      }
      decorators.push(new DecoratorExpr(name.value, args));
    }
    
    const declaration = this.declaration();
    return new DecoratedDeclaration(decorators, declaration);
  }

  // Generator function (fn* or *)
  generatorDeclaration(isAsync = false) {
    this.consume(TokenType.FN, "Expected 'fn' after '*'");
    const name = this.consume(TokenType.IDENTIFIER, "Expected generator name");
    this.consume(TokenType.LPAREN, "Expected '(' after generator name");
    const params = this.parseFunctionParams();
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    this.consume(TokenType.LBRACE, "Expected '{' before generator body");
    const body = this.block();
    
    return new GeneratorDeclaration(name.value, params, body, isAsync);
  }

  // Enum declaration
  enumDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected enum name");
    this.consume(TokenType.LBRACE, "Expected '{' before enum body");
    
    const members = [];
    let autoValue = 0;
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const memberName = this.consume(TokenType.IDENTIFIER, "Expected enum member name");
      let value = autoValue;
      
      if (this.match(TokenType.ASSIGN)) {
        const expr = this.expression();
        if (expr.type === 'NumberLiteral') {
          value = expr.value;
          autoValue = value;
        } else if (expr.type === 'StringLiteral') {
          value = expr.value;
        } else {
          value = expr;
        }
      }
      
      members.push({ name: memberName.value, value });
      autoValue++;
      this.match(TokenType.COMMA);
    }
    
    this.consume(TokenType.RBRACE, "Expected '}' after enum body");
    return new EnumDeclaration(name.value, members);
  }

  // Interface declaration
  interfaceDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected interface name");
    let extends_ = null;
    
    if (this.match(TokenType.EXTENDS)) {
      extends_ = [];
      do {
        extends_.push(this.consume(TokenType.IDENTIFIER, "Expected interface name").value);
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.LBRACE, "Expected '{' before interface body");
    const members = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const memberName = this.consume(TokenType.IDENTIFIER, "Expected member name");
      let typeAnnotation = null;
      
      if (this.match(TokenType.COLON)) {
        typeAnnotation = this.parseTypeAnnotation();
      }
      
      if (this.check(TokenType.LPAREN)) {
        // Method signature
        this.consume(TokenType.LPAREN, "Expected '('");
        const params = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            const paramName = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value;
            let paramType = null;
            if (this.match(TokenType.COLON)) {
              paramType = this.parseTypeAnnotation();
            }
            params.push({ name: paramName, type: paramType });
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, "Expected ')'");
        let returnType = null;
        if (this.match(TokenType.COLON)) {
          returnType = this.parseTypeAnnotation();
        }
        members.push({ kind: 'method', name: memberName.value, params, returnType });
      } else {
        // Property signature
        members.push({ kind: 'property', name: memberName.value, type: typeAnnotation });
      }
      
      this.match(TokenType.SEMICOLON);
      this.match(TokenType.COMMA);
    }
    
    this.consume(TokenType.RBRACE, "Expected '}' after interface body");
    return new InterfaceDeclaration(name.value, members, extends_);
  }

  // Type alias
  typeAliasDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected type name");
    this.consume(TokenType.ASSIGN, "Expected '=' after type name");
    const type = this.parseTypeAnnotation();
    return new TypeAliasDeclaration(name.value, type);
  }

  // Parse type annotation
  parseTypeAnnotation() {
    // Handle object type: {x: number, y: number}
    if (this.check(TokenType.LBRACE)) {
      this.advance();
      const properties = [];
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const key = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
        this.consume(TokenType.COLON, "Expected ':' after property name");
        const type = this.parseTypeAnnotation();
        properties.push({ key, type });
        this.match(TokenType.COMMA);
      }
      this.consume(TokenType.RBRACE, "Expected '}' after object type");
      return { kind: 'object', properties };
    }
    
    // Handle array type: number[]
    if (this.check(TokenType.LBRACKET)) {
      this.advance();
      this.consume(TokenType.RBRACKET, "Expected ']' for array type");
      return { kind: 'array', elementType: null };
    }
    
    let typeName = this.consume(TokenType.IDENTIFIER, "Expected type name").value;
    let nullable = false;
    let generic = null;
    
    // Check for generic types like Array<number>
    if (this.match(TokenType.LT)) {
      generic = this.parseTypeAnnotation();
      this.consume(TokenType.GT, "Expected '>' after generic type");
    }
    
    // Check for nullable type
    if (this.match(TokenType.QUESTION)) {
      nullable = true;
    }
    
    // Union types
    if (this.match(TokenType.BITWISE_OR)) {
      const types = [new TypeAnnotation(typeName, nullable, generic)];
      do {
        types.push(this.parseTypeAnnotation());
      } while (this.match(TokenType.BITWISE_OR));
      return { kind: 'union', types };
    }
    
    return new TypeAnnotation(typeName, nullable, generic);
  }

  letDeclaration(isConst) {
    // Check for destructuring
    if (this.check(TokenType.LBRACKET)) {
      return this.arrayDestructuring(isConst);
    }
    if (this.check(TokenType.LBRACE)) {
      return this.objectDestructuring(isConst);
    }
    
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name");
    let value = null;
    if (this.match(TokenType.ASSIGN)) {
      value = this.expression();
    }
    return new LetDeclaration(name.value, value, isConst);
  }

  arrayDestructuring(isConst) {
    this.consume(TokenType.LBRACKET, "Expected '[' for array destructuring");
    const pattern = [];
    if (!this.check(TokenType.RBRACKET)) {
      do {
        if (this.match(TokenType.COMMA)) {
          pattern.push(null); // Skip element
        } else if (this.match(TokenType.SPREAD)) {
          const rest = this.consume(TokenType.IDENTIFIER, "Expected identifier after '...'");
          pattern.push({ type: 'rest', name: rest.value });
        } else {
          const name = this.consume(TokenType.IDENTIFIER, "Expected identifier in destructuring");
          let defaultValue = null;
          if (this.match(TokenType.ASSIGN)) {
            defaultValue = this.expression();
          }
          pattern.push({ type: 'element', name: name.value, default: defaultValue });
        }
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RBRACKET, "Expected ']' after array destructuring");
    this.consume(TokenType.ASSIGN, "Expected '=' after destructuring pattern");
    const value = this.expression();
    return new DestructuringDeclaration(pattern, value, true, isConst);
  }

  objectDestructuring(isConst) {
    this.consume(TokenType.LBRACE, "Expected '{' for object destructuring");
    const pattern = [];
    if (!this.check(TokenType.RBRACE)) {
      do {
        if (this.match(TokenType.SPREAD)) {
          const rest = this.consume(TokenType.IDENTIFIER, "Expected identifier after '...'");
          pattern.push({ type: 'rest', name: rest.value });
        } else {
          const key = this.consume(TokenType.IDENTIFIER, "Expected property name");
          let name = key.value;
          let defaultValue = null;
          if (this.match(TokenType.COLON)) {
            const newName = this.consume(TokenType.IDENTIFIER, "Expected alias name");
            name = newName.value;
          }
          if (this.match(TokenType.ASSIGN)) {
            defaultValue = this.expression();
          }
          pattern.push({ type: 'property', key: key.value, name: name, default: defaultValue });
        }
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RBRACE, "Expected '}' after object destructuring");
    this.consume(TokenType.ASSIGN, "Expected '=' after destructuring pattern");
    const value = this.expression();
    return new DestructuringDeclaration(pattern, value, false, isConst);
  }

  functionDeclaration(isAsync) {
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name");
    this.consume(TokenType.LPAREN, "Expected '(' after function name");
    
    const params = this.parseFunctionParams();
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    
    this.consume(TokenType.LBRACE, "Expected '{' before function body");
    const body = this.block();
    
    return new FunctionDeclaration(name.value, params, body, isAsync);
  }

  parseFunctionParams() {
    const params = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        if (this.match(TokenType.SPREAD)) {
          const rest = this.consume(TokenType.IDENTIFIER, "Expected parameter name after '...'");
          params.push({ type: 'rest', name: rest.value });
        } else {
          const param = this.consume(TokenType.IDENTIFIER, "Expected parameter name");
          let defaultValue = null;
          if (this.match(TokenType.ASSIGN)) {
            defaultValue = this.expression();
          }
          params.push({ type: 'param', name: param.value, default: defaultValue });
        }
      } while (this.match(TokenType.COMMA));
    }
    return params;
  }

  classDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected class name");
    let superClass = null;
    if (this.match(TokenType.EXTENDS)) {
      superClass = this.consume(TokenType.IDENTIFIER, "Expected superclass name").value;
    }
    this.consume(TokenType.LBRACE, "Expected '{' before class body");
    
    const body = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      body.push(this.classElement());
    }
    this.consume(TokenType.RBRACE, "Expected '}' after class body");
    
    return new ClassDeclaration(name.value, superClass, body);
  }

  classElement() {
    let isStatic = false;
    let isAsync = false;
    
    if (this.match(TokenType.STATIC)) {
      isStatic = true;
    }
    if (this.match(TokenType.ASYNC)) {
      isAsync = true;
    }
    
    // Check for getter/setter
    let kind = 'method';
    if (this.check(TokenType.IDENTIFIER) && (this.peek().value === 'get' || this.peek().value === 'set')) {
      const next = this.peekNext();
      if (next && next.type === TokenType.IDENTIFIER) {
        kind = this.advance().value;
      }
    }
    
    const key = this.consume(TokenType.IDENTIFIER, "Expected method or property name");
    
    // Method
    if (this.check(TokenType.LPAREN)) {
      this.consume(TokenType.LPAREN, "Expected '('");
      const params = this.parseFunctionParams();
      this.consume(TokenType.RPAREN, "Expected ')'");
      this.consume(TokenType.LBRACE, "Expected '{'");
      const body = this.block();
      
      const methodKind = key.value === 'constructor' ? 'constructor' : kind;
      return new MethodDefinition(key.value, params, body, isStatic, isAsync, methodKind);
    }
    
    // Property
    let value = null;
    if (this.match(TokenType.ASSIGN)) {
      value = this.expression();
    }
    return new PropertyDefinition(key.value, value, isStatic);
  }

  importStatement() {
    const specifiers = [];
    
    if (this.match(TokenType.STAR)) {
      this.consume(TokenType.AS, "Expected 'as' after '*'");
      const alias = this.consume(TokenType.IDENTIFIER, "Expected alias name");
      specifiers.push({ type: 'namespace', name: alias.value });
    } else if (this.match(TokenType.LBRACE)) {
      do {
        const imported = this.consume(TokenType.IDENTIFIER, "Expected import name");
        let local = imported.value;
        if (this.match(TokenType.AS)) {
          local = this.consume(TokenType.IDENTIFIER, "Expected alias").value;
        }
        specifiers.push({ type: 'named', imported: imported.value, local });
      } while (this.match(TokenType.COMMA));
      this.consume(TokenType.RBRACE, "Expected '}'");
    } else if (this.check(TokenType.IDENTIFIER)) {
      const name = this.advance();
      specifiers.push({ type: 'default', name: name.value });
    }
    
    this.consume(TokenType.FROM, "Expected 'from'");
    const source = this.consume(TokenType.STRING, "Expected module path");
    
    return new ImportStatement(specifiers, source.value);
  }

  exportStatement() {
    let isDefault = false;
    
    if (this.match(TokenType.DEFAULT)) {
      isDefault = true;
      const expr = this.expression();
      return new ExportStatement(expr, null, null, true);
    }
    
    if (this.match(TokenType.LET) || this.match(TokenType.CONST)) {
      const isConst = this.previous().type === TokenType.CONST;
      const decl = this.letDeclaration(isConst);
      return new ExportStatement(decl, null, null, false);
    }
    
    if (this.match(TokenType.FN)) {
      const decl = this.functionDeclaration(false);
      return new ExportStatement(decl, null, null, false);
    }
    
    if (this.match(TokenType.CLASS)) {
      const decl = this.classDeclaration();
      return new ExportStatement(decl, null, null, false);
    }
    
    // Named exports
    if (this.match(TokenType.LBRACE)) {
      const specifiers = [];
      do {
        const local = this.consume(TokenType.IDENTIFIER, "Expected export name");
        let exported = local.value;
        if (this.match(TokenType.AS)) {
          exported = this.consume(TokenType.IDENTIFIER, "Expected alias").value;
        }
        specifiers.push({ local: local.value, exported });
      } while (this.match(TokenType.COMMA));
      this.consume(TokenType.RBRACE, "Expected '}'");
      
      let source = null;
      if (this.match(TokenType.FROM)) {
        source = this.consume(TokenType.STRING, "Expected module path").value;
      }
      return new ExportStatement(null, specifiers, source, false);
    }
    
    throw new Error("Invalid export statement");
  }

  statement() {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.SWITCH) || this.match(TokenType.MATCH)) return this.switchOrMatchStatement();
    if (this.match(TokenType.LOOP)) return this.loopStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.DO)) return this.doWhileStatement();
    if (this.match(TokenType.TRY)) return this.tryStatement();
    if (this.match(TokenType.THROW)) return this.throwStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.YIELD)) return this.yieldStatement();
    if (this.match(TokenType.BREAK)) return new BreakStatement();
    if (this.match(TokenType.CONTINUE)) return new ContinueStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.ASSERT)) return this.assertStatement();
    if (this.match(TokenType.DEBUG)) return this.debugStatement();
    if (this.match(TokenType.WITH)) return this.withStatement();
    if (this.match(TokenType.LBRACE)) return this.block();
    return this.expressionStatement();
  }

  // Yield statement/expression
  yieldStatement() {
    let delegate = false;
    if (this.match(TokenType.STAR)) {
      delegate = true;
    }
    let argument = null;
    if (!this.check(TokenType.RBRACE) && !this.check(TokenType.SEMICOLON) && !this.isAtEnd()) {
      argument = this.expression();
    }
    return new YieldExpr(argument, delegate);
  }

  // Assert statement
  assertStatement() {
    const condition = this.expression();
    let message = null;
    if (this.match(TokenType.COMMA)) {
      message = this.expression();
    }
    return new AssertStatement(condition, message);
  }

  // Debug statement
  debugStatement() {
    const expression = this.expression();
    return new DebugStatement(expression);
  }

  // With statement (context manager)
  withStatement() {
    const object = this.expression();
    let alias = null;
    if (this.match(TokenType.AS)) {
      alias = this.consume(TokenType.IDENTIFIER, "Expected alias name").value;
    }
    this.consume(TokenType.LBRACE, "Expected '{' after with expression");
    const body = this.block();
    return new WithStatement(object, alias, body);
  }

  // Switch or Match (pattern matching)
  switchOrMatchStatement() {
    const isMatch = this.previous().type === TokenType.MATCH;
    const discriminant = this.expression();
    this.consume(TokenType.LBRACE, "Expected '{' before cases");
    
    if (isMatch) {
      return this.matchExpression(discriminant);
    }
    
    const cases = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.CASE)) {
        const test = this.expression();
        this.consume(TokenType.COLON, "Expected ':' after case");
        const consequent = [];
        while (!this.check(TokenType.CASE) && !this.check(TokenType.DEFAULT) && 
               !this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          if (this.match(TokenType.BREAK)) {
            consequent.push(new BreakStatement());
            break;
          }
          consequent.push(this.statement());
        }
        cases.push(new SwitchCase(test, consequent));
      } else if (this.match(TokenType.DEFAULT)) {
        this.consume(TokenType.COLON, "Expected ':' after default");
        const consequent = [];
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          consequent.push(this.statement());
        }
        cases.push(new SwitchCase(null, consequent));
      }
    }
    
    this.consume(TokenType.RBRACE, "Expected '}' after switch body");
    return new SwitchStatement(discriminant, cases);
  }

  // Advanced pattern matching
  matchExpression(discriminant) {
    const arms = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const pattern = this.parsePattern();
      let guard = null;
      
      // Optional 'when' guard
      if (this.match(TokenType.WHEN) || this.match(TokenType.IF)) {
        guard = this.expression();
      }
      
      this.consume(TokenType.ARROW, "Expected '=>' after pattern");
      
      let body;
      if (this.check(TokenType.LBRACE)) {
        this.consume(TokenType.LBRACE, "Expected '{'");
        body = this.block();
      } else {
        body = this.expression();
      }
      
      arms.push(new MatchArm(pattern, guard, body));
      this.match(TokenType.COMMA);
    }
    
    this.consume(TokenType.RBRACE, "Expected '}' after match body");
    return new MatchExpr(discriminant, arms);
  }

  // Parse match patterns
  parsePattern() {
    // Wildcard pattern (_)
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === '_') {
      this.advance();
      return new WildcardPattern();
    }
    
    // Array pattern
    if (this.match(TokenType.LBRACKET)) {
      const elements = [];
      if (!this.check(TokenType.RBRACKET)) {
        do {
          if (this.match(TokenType.SPREAD)) {
            const name = this.consume(TokenType.IDENTIFIER, "Expected identifier after '...'");
            elements.push({ type: 'rest', name: name.value });
          } else {
            elements.push(this.parsePattern());
          }
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after array pattern");
      return new ArrayPattern(elements);
    }
    
    // Object pattern
    if (this.match(TokenType.LBRACE)) {
      const properties = [];
      if (!this.check(TokenType.RBRACE)) {
        do {
          if (this.match(TokenType.SPREAD)) {
            const name = this.consume(TokenType.IDENTIFIER, "Expected identifier after '...'");
            properties.push({ type: 'rest', name: name.value });
          } else {
            const key = this.consume(TokenType.IDENTIFIER, "Expected property name");
            let pattern = new BindingPattern(key.value);
            if (this.match(TokenType.COLON)) {
              pattern = this.parsePattern();
            }
            properties.push({ key: key.value, pattern });
          }
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACE, "Expected '}' after object pattern");
      return new ObjectPattern(properties);
    }
    
    // Range pattern (1..10 or 1..=10)
    if (this.check(TokenType.NUMBER)) {
      const start = this.primary();
      if (this.match(TokenType.RANGE)) {
        const end = this.primary();
        return new RangePattern(start, end, false);
      } else if (this.match(TokenType.RANGE_INCLUSIVE)) {
        const end = this.primary();
        return new RangePattern(start, end, true);
      }
      return new LiteralPattern(start);
    }
    
    // String literal pattern
    if (this.check(TokenType.STRING)) {
      return new LiteralPattern(this.primary());
    }
    
    // Boolean literal pattern
    if (this.check(TokenType.TRUE) || this.check(TokenType.FALSE)) {
      return new LiteralPattern(this.primary());
    }
    
    // Type check pattern (is Type)
    if (this.match(TokenType.IS)) {
      const typeName = this.consume(TokenType.IDENTIFIER, "Expected type name");
      return new TypePattern(typeName.value);
    }
    
    // Or pattern (pattern1 | pattern2)
    let pattern = this.parseSinglePattern();
    if (this.check(TokenType.BITWISE_OR)) {
      const patterns = [pattern];
      while (this.match(TokenType.BITWISE_OR)) {
        patterns.push(this.parseSinglePattern());
      }
      return new OrPattern(patterns);
    }
    
    return pattern;
  }

  parseSinglePattern() {
    if (this.check(TokenType.IDENTIFIER)) {
      const name = this.advance();
      return new BindingPattern(name.value);
    }
    if (this.check(TokenType.NUMBER) || this.check(TokenType.STRING)) {
      return new LiteralPattern(this.primary());
    }
    throw new Error("Expected pattern");
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
    
    // Check for for-in style: loop item in array
    if (this.match(TokenType.IN)) {
      const iterable = this.expression();
      this.consume(TokenType.LBRACE, "Expected '{' before loop body");
      const body = this.block();
      return new ForInStatement(variable.value, iterable, body);
    }
    
    // Check for for-of style: loop item of array
    if (this.match(TokenType.OF)) {
      const iterable = this.expression();
      this.consume(TokenType.LBRACE, "Expected '{' before loop body");
      const body = this.block();
      return new ForOfStatement(variable.value, iterable, body);
    }
    
    // Classic loop: loop i from 0 to 10
    this.consume(TokenType.FROM, "Expected 'from', 'in', or 'of' in loop");
    const from = this.expression();
    this.consume(TokenType.TO, "Expected 'to' in loop");
    const to = this.expression();
    
    let step = null;
    if (this.match(TokenType.STEP)) {
      step = this.expression();
    }
    
    this.consume(TokenType.LBRACE, "Expected '{' before loop body");
    const body = this.block();
    
    return new LoopStatement(variable.value, from, to, body, step);
  }

  forStatement() {
    const variable = this.consume(TokenType.IDENTIFIER, "Expected loop variable");
    
    if (this.match(TokenType.IN)) {
      const iterable = this.expression();
      this.consume(TokenType.LBRACE, "Expected '{' before loop body");
      const body = this.block();
      return new ForInStatement(variable.value, iterable, body);
    }
    
    if (this.match(TokenType.OF)) {
      const iterable = this.expression();
      this.consume(TokenType.LBRACE, "Expected '{' before loop body");
      const body = this.block();
      return new ForOfStatement(variable.value, iterable, body);
    }
    
    throw new Error("Expected 'in' or 'of' after for variable");
  }

  whileStatement() {
    const condition = this.expression();
    this.consume(TokenType.LBRACE, "Expected '{' after while condition");
    const body = this.block();
    return new WhileStatement(condition, body);
  }

  doWhileStatement() {
    this.consume(TokenType.LBRACE, "Expected '{' after do");
    const body = this.block();
    this.consume(TokenType.WHILE, "Expected 'while' after do block");
    const condition = this.expression();
    return new DoWhileStatement(body, condition);
  }

  tryStatement() {
    this.consume(TokenType.LBRACE, "Expected '{' after try");
    const block = this.block();
    
    let handler = null;
    if (this.match(TokenType.CATCH)) {
      let param = null;
      if (this.match(TokenType.LPAREN)) {
        param = this.consume(TokenType.IDENTIFIER, "Expected catch parameter").value;
        this.consume(TokenType.RPAREN, "Expected ')' after catch parameter");
      }
      this.consume(TokenType.LBRACE, "Expected '{' after catch");
      const catchBody = this.block();
      handler = { param, body: catchBody };
    }
    
    let finalizer = null;
    if (this.match(TokenType.FINALLY)) {
      this.consume(TokenType.LBRACE, "Expected '{' after finally");
      finalizer = this.block();
    }
    
    return new TryStatement(block, handler, finalizer);
  }

  throwStatement() {
    const argument = this.expression();
    return new ThrowStatement(argument);
  }

  returnStatement() {
    let value = null;
    if (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Check if next token could start an expression
      if (!this.check(TokenType.LET) && !this.check(TokenType.CONST) && !this.check(TokenType.FN) && 
          !this.check(TokenType.IF) && !this.check(TokenType.LOOP) && !this.check(TokenType.FOR) &&
          !this.check(TokenType.WHILE) && !this.check(TokenType.RETURN) && !this.check(TokenType.CLASS)) {
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
    
    // Check for compound assignment
    if (this.match(TokenType.ASSIGN)) {
      const value = this.expression();
      return new Assignment(expr, value, '=');
    }
    if (this.match(TokenType.PLUS_ASSIGN)) {
      const value = this.expression();
      return new Assignment(expr, value, '+=');
    }
    if (this.match(TokenType.MINUS_ASSIGN)) {
      const value = this.expression();
      return new Assignment(expr, value, '-=');
    }
    if (this.match(TokenType.STAR_ASSIGN)) {
      const value = this.expression();
      return new Assignment(expr, value, '*=');
    }
    if (this.match(TokenType.SLASH_ASSIGN)) {
      const value = this.expression();
      return new Assignment(expr, value, '/=');
    }
    if (this.match(TokenType.PERCENT_ASSIGN)) {
      const value = this.expression();
      return new Assignment(expr, value, '%=');
    }
    
    return expr;
  }

  expression() {
    return this.ternary();
  }

  ternary() {
    let expr = this.nullishCoalescing();
    
    if (this.match(TokenType.QUESTION)) {
      const consequent = this.expression();
      this.consume(TokenType.COLON, "Expected ':' in ternary expression");
      const alternate = this.ternary();
      return new TernaryExpr(expr, consequent, alternate);
    }
    
    return expr;
  }

  nullishCoalescing() {
    let expr = this.pipe();
    
    while (this.match(TokenType.NULLISH)) {
      const right = this.pipe();
      expr = new NullishCoalescing(expr, right);
    }
    
    return expr;
  }

  pipe() {
    let expr = this.or();
    
    while (this.match(TokenType.PIPE)) {
      const right = this.or();
      expr = new PipeExpr(expr, right);
    }
    
    return expr;
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
    let expr = this.bitwiseOr();
    while (this.match(TokenType.AND)) {
      const right = this.bitwiseOr();
      expr = new BinaryExpr(expr, 'and', right);
    }
    return expr;
  }

  bitwiseOr() {
    let expr = this.bitwiseXor();
    while (this.match(TokenType.BITWISE_OR)) {
      const right = this.bitwiseXor();
      expr = new BinaryExpr(expr, '|', right);
    }
    return expr;
  }

  bitwiseXor() {
    let expr = this.bitwiseAnd();
    while (this.match(TokenType.BITWISE_XOR)) {
      const right = this.bitwiseAnd();
      expr = new BinaryExpr(expr, '^', right);
    }
    return expr;
  }

  bitwiseAnd() {
    let expr = this.equality();
    while (this.match(TokenType.BITWISE_AND)) {
      const right = this.equality();
      expr = new BinaryExpr(expr, '&', right);
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
    let expr = this.shift();
    while (this.match(TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE, TokenType.INSTANCEOF)) {
      if (this.previous().type === TokenType.INSTANCEOF) {
        const right = this.shift();
        expr = new InstanceOfExpr(expr, right);
      } else {
        const operator = this.previous().value;
        const right = this.shift();
        expr = new BinaryExpr(expr, operator, right);
      }
    }
    return expr;
  }

  shift() {
    let expr = this.range();
    while (this.match(TokenType.LEFT_SHIFT, TokenType.RIGHT_SHIFT, TokenType.UNSIGNED_RIGHT_SHIFT)) {
      const operator = this.previous().value;
      const right = this.range();
      expr = new BinaryExpr(expr, operator, right);
    }
    return expr;
  }

  // Range expressions (1..10 or 1..=10)
  range() {
    let expr = this.term();
    
    if (this.match(TokenType.RANGE)) {
      const end = this.term();
      return new RangeExpr(expr, end, false);
    }
    
    if (this.match(TokenType.RANGE_INCLUSIVE)) {
      const end = this.term();
      return new RangeExpr(expr, end, true);
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
    if (this.match(TokenType.MINUS, TokenType.NOT, TokenType.BITWISE_NOT)) {
      const operator = this.previous().value;
      const operand = this.unary();
      return new UnaryExpr(operator, operand, true);
    }
    if (this.match(TokenType.INCREMENT)) {
      const operand = this.unary();
      return new UpdateExpr('++', operand, true);
    }
    if (this.match(TokenType.DECREMENT)) {
      const operand = this.unary();
      return new UpdateExpr('--', operand, true);
    }
    if (this.match(TokenType.TYPEOF)) {
      const argument = this.unary();
      return new TypeOfExpr(argument);
    }
    if (this.match(TokenType.DELETE)) {
      const argument = this.unary();
      return new DeleteExpr(argument);
    }
    if (this.match(TokenType.AWAIT)) {
      const argument = this.unary();
      return new AwaitExpr(argument);
    }
    if (this.match(TokenType.YIELD)) {
      let delegate = false;
      if (this.match(TokenType.STAR)) {
        delegate = true;
      }
      const argument = this.unary();
      return new YieldExpr(argument, delegate);
    }
    if (this.match(TokenType.LAZY)) {
      const expression = this.unary();
      return new LazyExpr(expression);
    }
    if (this.match(TokenType.NEW)) {
      return this.newExpression();
    }
    return this.postfix();
  }

  newExpression() {
    const callee = this.call();
    // Arguments parsed in call() if LPAREN follows
    if (callee.type === 'FunctionCall') {
      return new NewExpr(callee.callee, callee.args);
    }
    return new NewExpr(callee, []);
  }

  postfix() {
    let expr = this.call();
    
    if (this.match(TokenType.INCREMENT)) {
      return new UpdateExpr('++', expr, false);
    }
    if (this.match(TokenType.DECREMENT)) {
      return new UpdateExpr('--', expr, false);
    }
    
    return expr;
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
      } else if (this.match(TokenType.OPTIONAL_CHAIN)) {
        if (this.match(TokenType.LBRACKET)) {
          const index = this.expression();
          this.consume(TokenType.RBRACKET, "Expected ']' after index");
          expr = new OptionalChain(expr, index, true);
        } else {
          const name = this.consume(TokenType.IDENTIFIER, "Expected property name after '?.'");
          expr = new OptionalChain(expr, name.value, false);
        }
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
        if (this.match(TokenType.SPREAD)) {
          args.push(new SpreadElement(this.expression()));
        } else {
          args.push(this.expression());
        }
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
    
    if (this.match(TokenType.TEMPLATE_STRING)) {
      return this.parseTemplateString(this.previous().value);
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
    
    if (this.match(TokenType.THIS) || this.match(TokenType.SELF)) {
      return new ThisExpr();
    }
    
    if (this.match(TokenType.SUPER)) {
      return new SuperExpr();
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
    
    if (this.match(TokenType.FN)) {
      return this.anonymousFunction(false);
    }
    
    if (this.match(TokenType.ASYNC)) {
      if (this.match(TokenType.FN)) {
        return this.anonymousFunction(true);
      }
    }
    
    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.previous().value;
      
      // Check for arrow function: (a, b) => or a =>
      if (this.check(TokenType.ARROW)) {
        return this.arrowFunctionFromIdentifier(name);
      }
      
      return new Identifier(name);
    }
    
    if (this.match(TokenType.LBRACKET)) {
      // Check for empty array
      if (this.match(TokenType.RBRACKET)) {
        return new ArrayLiteral([]);
      }
      
      // Check for list comprehension: [x * 2 for x in items]
      // or [x * 2 for x in items if x > 0]
      const firstExpr = this.expression();
      
      if (this.match(TokenType.FOR)) {
        // List comprehension
        const variable = this.consume(TokenType.IDENTIFIER, "Expected variable in comprehension").value;
        this.consume(TokenType.IN, "Expected 'in' in comprehension");
        const iterable = this.expression();
        let condition = null;
        if (this.match(TokenType.IF)) {
          condition = this.expression();
        }
        this.consume(TokenType.RBRACKET, "Expected ']' after comprehension");
        return new ListComprehension(firstExpr, variable, iterable, condition);
      }
      
      // Regular array
      const elements = [firstExpr];
      while (this.match(TokenType.COMMA)) {
        if (this.check(TokenType.RBRACKET)) break;
        if (this.match(TokenType.SPREAD)) {
          elements.push(new SpreadElement(this.expression()));
        } else if (this.check(TokenType.COMMA)) {
          elements.push(null); // Sparse array
        } else {
          elements.push(this.expression());
        }
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after array elements");
      return new ArrayLiteral(elements);
    }

    if (this.check(TokenType.LBRACKET) && !this.check(TokenType.RBRACKET)) {
      // Check if empty array first
      return new ArrayLiteral([]);
    }
    
    if (this.match(TokenType.LBRACE)) {
      const properties = {};
      if (!this.check(TokenType.RBRACE)) {
        do {
          if (this.match(TokenType.SPREAD)) {
            const spread = this.expression();
            properties['...spread' + Object.keys(properties).length] = new SpreadElement(spread);
          } else {
            let key;
            if (this.match(TokenType.LBRACKET)) {
              // Computed property name
              key = this.expression();
              this.consume(TokenType.RBRACKET, "Expected ']'");
            } else if (this.check(TokenType.STRING)) {
              key = this.advance().value;
            } else {
              key = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
            }
            
            // Shorthand property: { name } same as { name: name }
            if (!this.check(TokenType.COLON) && typeof key === 'string') {
              if (this.check(TokenType.COMMA) || this.check(TokenType.RBRACE)) {
                properties[key] = new Identifier(key);
                continue;
              }
            }
            
            this.consume(TokenType.COLON, "Expected ':' after property name");
            const value = this.expression();
            properties[typeof key === 'string' ? key : JSON.stringify(key)] = value;
          }
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACE, "Expected '}' after object properties");
      return new ObjectLiteral(properties);
    }
    
    if (this.match(TokenType.LPAREN)) {
      // Could be grouping or arrow function params
      const start = this.current - 1;
      
      // Use a safer approach - check if it looks like arrow function params
      // Only try arrow function parsing if we see simple patterns:
      // () => or (id) => or (id, id) => or (id = expr) => or (...rest) =>
      if (this.check(TokenType.RPAREN)) {
        this.advance();
        if (this.match(TokenType.ARROW)) {
          return this.arrowFunctionBody([], false);
        }
        this.current = start + 1;
      } else if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.SPREAD)) {
        // Look ahead to see if this could be arrow function params
        const savedPos = this.current;
        let looksLikeArrow = true;
        let depth = 1;
        
        // Scan ahead to find matching ) and check for =>
        while (depth > 0 && !this.isAtEnd()) {
          if (this.peek().type === TokenType.LPAREN) depth++;
          if (this.peek().type === TokenType.RPAREN) depth--;
          
          // If we see DOT or [ before ), it's not arrow params, it's an expression
          if (depth > 0 && (this.peek().type === TokenType.DOT || 
              this.peek().type === TokenType.LBRACKET ||
              this.peek().type === TokenType.PLUS ||
              this.peek().type === TokenType.MINUS ||
              this.peek().type === TokenType.STAR ||
              this.peek().type === TokenType.SLASH)) {
            looksLikeArrow = false;
            break;
          }
          this.advance();
        }
        
        // Check if next token is =>
        if (looksLikeArrow && this.peek().type === TokenType.ARROW) {
          // Reset and parse as arrow function
          this.current = savedPos;
          const params = [];
          do {
            if (this.match(TokenType.SPREAD)) {
              params.push({ type: 'rest', name: this.consume(TokenType.IDENTIFIER, "Expected parameter").value });
            } else {
              const param = this.consume(TokenType.IDENTIFIER, "Expected parameter");
              let defaultValue = null;
              if (this.match(TokenType.ASSIGN)) {
                defaultValue = this.expression();
              }
              params.push({ type: 'param', name: param.value, default: defaultValue });
            }
          } while (this.match(TokenType.COMMA));
          this.consume(TokenType.RPAREN, "Expected ')' after parameters");
          this.consume(TokenType.ARROW, "Expected '=>'");
          return this.arrowFunctionBody(params, false);
        }
        
        // Reset and parse as regular expression
        this.current = savedPos;
      }
      
      // Regular grouping
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }
    
    throw new Error(`Unexpected token: ${this.peek().type} at line ${this.peek().line}`);
  }

  anonymousFunction(isAsync) {
    this.consume(TokenType.LPAREN, "Expected '(' for anonymous function");
    const params = this.parseFunctionParams();
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    this.consume(TokenType.LBRACE, "Expected '{' before function body");
    const body = this.block();
    return new FunctionDeclaration(null, params, body, isAsync);
  }

  arrowFunctionFromIdentifier(name) {
    this.consume(TokenType.ARROW, "Expected '=>'");
    const params = [{ type: 'param', name, default: null }];
    return this.arrowFunctionBody(params, false);
  }

  arrowFunctionBody(params, isAsync) {
    let body;
    if (this.match(TokenType.LBRACE)) {
      body = this.block();
    } else {
      // Expression body
      const expr = this.expression();
      body = new Block([new ReturnStatement(expr)]);
    }
    return new ArrowFunction(params, body, isAsync);
  }

  parseTemplateString(templateParts) {
    const parts = [];
    
    // The lexer now passes an array of parts
    for (const part of templateParts) {
      if (part.type === 'string') {
        parts.push({ type: 'string', value: part.value });
      } else if (part.type === 'expr') {
        // Parse the expression string
        const { Lexer } = require('./lexer');
        const exprLexer = new Lexer(part.value);
        const exprTokens = exprLexer.tokenize();
        const exprParser = new Parser(exprTokens);
        const exprAST = exprParser.expression();
        parts.push({ type: 'expression', value: exprAST });
      }
    }
    
    return new TemplateLiteral(parts);
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

  peekNext() {
    if (this.current + 1 >= this.tokens.length) return null;
    return this.tokens[this.current + 1];
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
  TemplateLiteral,
  BoolLiteral,
  NullLiteral,
  ArrayLiteral,
  ObjectLiteral,
  SpreadElement,
  Identifier,
  BinaryExpr,
  UnaryExpr,
  UpdateExpr,
  LetDeclaration,
  DestructuringDeclaration,
  Assignment,
  TernaryExpr,
  NullishCoalescing,
  OptionalChain,
  PipeExpr,
  FunctionDeclaration,
  ArrowFunction,
  FunctionCall,
  NewExpr,
  AwaitExpr,
  ClassDeclaration,
  MethodDefinition,
  PropertyDefinition,
  ThisExpr,
  SuperExpr,
  IfStatement,
  SwitchStatement,
  SwitchCase,
  LoopStatement,
  ForInStatement,
  ForOfStatement,
  WhileStatement,
  DoWhileStatement,
  TryStatement,
  ThrowStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  LabeledStatement,
  ImportStatement,
  ExportStatement,
  PrintStatement,
  InputExpr,
  TypeOfExpr,
  InstanceOfExpr,
  DeleteExpr,
  IndexAccess,
  MemberAccess,
  Block,
  
  // Advanced features - Most wanted by developers
  GeneratorDeclaration,
  YieldExpr,
  EnumDeclaration,
  MatchExpr,
  MatchArm,
  WildcardPattern,
  LiteralPattern,
  RangePattern,
  ArrayPattern,
  ObjectPattern,
  OrPattern,
  BindingPattern,
  TypePattern,
  RangeExpr,
  DecoratorExpr,
  DecoratedDeclaration,
  TypeAnnotation,
  TypedDeclaration,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  AssertStatement,
  DebugStatement,
  ListComprehension,
  DictComprehension,
  LazyExpr,
  ChainExpr,
  GetterDeclaration,
  SetterDeclaration,
  WithStatement
};
