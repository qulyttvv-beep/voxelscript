#!/usr/bin/env node

// VoxelScript - Main Entry Point
// Run .voxel files from the command line

const fs = require('fs');
const path = require('path');
const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Interpreter } = require('./interpreter');

async function runFile(filePath) {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter();
    await interpreter.run(ast);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function runRepl() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('VoxelScript REPL v1.0');
  console.log('Type "exit" to quit\n');

  const interpreter = new Interpreter();

  const prompt = () => {
    rl.question('voxel> ', async (input) => {
      if (input.trim() === 'exit') {
        rl.close();
        return;
      }

      if (input.trim() === '') {
        prompt();
        return;
      }

      try {
        const lexer = new Lexer(input);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const result = await interpreter.run(ast);
        if (result !== null && result !== undefined) {
          console.log(result);
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }

      prompt();
    });
  };

  prompt();
}

// Run code from string
async function runCode(code) {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const interpreter = new Interpreter();
  return await interpreter.run(ast);
}

// Version info
const VERSION = '1.0.0';

// CLI Help
function showHelp() {
  console.log(`
\x1b[32m██╗   ██╗ ██████╗ ██╗  ██╗███████╗██╗     
██║   ██║██╔═══██╗╚██╗██╔╝██╔════╝██║     
██║   ██║██║   ██║ ╚███╔╝ █████╗  ██║     
╚██╗ ██╔╝██║   ██║ ██╔██╗ ██╔══╝  ██║     
 ╚████╔╝ ╚██████╔╝██╔╝ ██╗███████╗███████╗
  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝\x1b[0m

\x1b[36mVoxelScript v${VERSION}\x1b[0m - The Matrix Programming Language

\x1b[33mUsage:\x1b[0m
  voxel                     Start interactive REPL
  voxel <file.voxel>        Run a VoxelScript file
  voxel -e "<code>"         Execute code directly
  voxel --version, -v       Show version
  voxel --help, -h          Show this help

\x1b[33mExamples:\x1b[0m
  voxel hello.voxel
  voxel -e "print 'Hello, Matrix!'"
  voxel examples/calculator.voxel

\x1b[33mFile Extensions:\x1b[0m
  .voxel    VoxelScript source file
  .vxl      VoxelScript source file (short)

\x1b[32mWelcome to the Matrix!\x1b[0m
`);
}

function showVersion() {
  console.log(`VoxelScript v${VERSION}`);
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0) {
  runRepl();
} else if (args[0] === '--help' || args[0] === '-h') {
  showHelp();
} else if (args[0] === '--version' || args[0] === '-v') {
  showVersion();
} else if (args[0] === '-e' && args[1]) {
  runCode(args[1]).catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
} else {
  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`\x1b[31mError: File not found: ${filePath}\x1b[0m`);
    process.exit(1);
  }
  runFile(filePath);
}

module.exports = { runFile, runCode, runRepl, VERSION };
