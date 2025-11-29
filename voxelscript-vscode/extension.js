const vscode = require('vscode');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

/**
 * VoxelScript VS Code Extension
 * Provides language support for the VoxelScript programming language
 * Now uses the system-installed 'voxel' command - no marketplace needed!
 */

let outputChannel;

function activate(context) {
    console.log('VoxelScript extension activated!');
    
    // Create output channel for VoxelScript
    outputChannel = vscode.window.createOutputChannel('VoxelScript');
    
    // Register Run command
    const runCommand = vscode.commands.registerCommand('voxelscript.run', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        
        const document = editor.document;
        if (document.languageId !== 'voxelscript') {
            vscode.window.showErrorMessage('Current file is not a VoxelScript file');
            return;
        }
        
        // Save the file first
        await document.save();
        
        const config = vscode.workspace.getConfiguration('voxelscript');
        
        // Show output
        if (config.get('showOutputOnRun')) {
            outputChannel.show(true);
        }
        
        outputChannel.clear();
        outputChannel.appendLine('═'.repeat(50));
        outputChannel.appendLine('  VOXELSCRIPT - Running: ' + path.basename(document.fileName));
        outputChannel.appendLine('═'.repeat(50));
        outputChannel.appendLine('');
        
        // Run the script using the system 'voxel' command
        const filePath = document.fileName;
        const startTime = Date.now();
        
        // Use 'voxel' command directly (installed via install-windows.bat or install.sh)
        const isWindows = os.platform() === 'win32';
        const voxelCmd = isWindows ? 'voxel.cmd' : 'voxel';
        
        const process = spawn(voxelCmd, [filePath], {
            cwd: path.dirname(filePath)
        });
        
        process.stdout.on('data', (data) => {
            outputChannel.append(data.toString());
        });
        
        process.stderr.on('data', (data) => {
            outputChannel.append(`[ERROR] ${data.toString()}`);
        });
        
        process.on('close', (code) => {
            const elapsed = Date.now() - startTime;
            outputChannel.appendLine('');
            outputChannel.appendLine('─'.repeat(50));
            if (code === 0) {
                outputChannel.appendLine(`✓ Completed successfully in ${elapsed}ms`);
            } else {
                outputChannel.appendLine(`✗ Exited with code ${code} (${elapsed}ms)`);
            }
        });
        
        process.on('error', (err) => {
            outputChannel.appendLine(`[ERROR] Failed to run: ${err.message}`);
            vscode.window.showErrorMessage(`Failed to run VoxelScript: ${err.message}`);
        });
    });
    
    // Register Open in Editor command
    const openInEditorCommand = vscode.commands.registerCommand('voxelscript.runInEditor', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const config = vscode.workspace.getConfiguration('voxelscript');
        let editorPath = config.get('editorPath');
        
        if (!editorPath) {
            vscode.window.showWarningMessage(
                'VoxelScript Editor path not configured. Set it in settings: voxelscript.editorPath'
            );
            return;
        }
        
        const filePath = editor.document.fileName;
        
        // Launch the VoxelScript Editor with the file
        const process = spawn(editorPath, [filePath], {
            detached: true,
            stdio: 'ignore'
        });
        process.unref();
    });
    
    // Register hover provider for built-in functions
    const hoverProvider = vscode.languages.registerHoverProvider('voxelscript', {
        provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);
            
            const docs = getBuiltinDocumentation(word);
            if (docs) {
                const markdown = new vscode.MarkdownString();
                markdown.appendCodeblock(docs.signature, 'voxelscript');
                markdown.appendMarkdown('\n\n' + docs.description);
                if (docs.example) {
                    markdown.appendMarkdown('\n\n**Example:**\n');
                    markdown.appendCodeblock(docs.example, 'voxelscript');
                }
                return new vscode.Hover(markdown);
            }
        }
    });
    
    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider('voxelscript', {
        provideCompletionItems(document, position) {
            const completions = [];
            
            // Keywords
            const keywords = ['if', 'else', 'elif', 'loop', 'while', 'for', 'in', 'break', 'continue', 'return', 'fn', 'let', 'const', 'class', 'match', 'case', 'async', 'await'];
            keywords.forEach(kw => {
                const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
                item.detail = 'VoxelScript keyword';
                completions.push(item);
            });
            
            // Built-in functions
            const builtins = Object.keys(BUILTIN_DOCS);
            builtins.forEach(fn => {
                const item = new vscode.CompletionItem(fn, vscode.CompletionItemKind.Function);
                const doc = BUILTIN_DOCS[fn];
                item.detail = doc.signature;
                item.documentation = new vscode.MarkdownString(doc.description);
                completions.push(item);
            });
            
            return completions;
        }
    }, '.', '(');
    
    context.subscriptions.push(
        runCommand,
        openInEditorCommand,
        hoverProvider,
        completionProvider,
        outputChannel
    );
}

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}

// Built-in function documentation
const BUILTIN_DOCS = {
    'print': {
        signature: 'print(value)',
        description: 'Prints a value to the console output.',
        example: 'print "Hello, World!"\nprint 42\nprint myVariable'
    },
    'input': {
        signature: 'input(prompt) -> string',
        description: 'Reads input from the user with an optional prompt.',
        example: 'let name = input("Enter your name: ")'
    },
    'len': {
        signature: 'len(value) -> number',
        description: 'Returns the length of a string, array, or object.',
        example: 'len("hello")  // 5\nlen([1, 2, 3])  // 3'
    },
    'type': {
        signature: 'type(value) -> string',
        description: 'Returns the type of a value as a string.',
        example: 'type(42)  // "number"\ntype("hi")  // "string"'
    },
    'range': {
        signature: 'range(start, end, step?) -> array',
        description: 'Creates an array of numbers from start to end.',
        example: 'range(0, 5)  // [0, 1, 2, 3, 4]\nrange(0, 10, 2)  // [0, 2, 4, 6, 8]'
    },
    'map': {
        signature: 'map(array, fn) -> array',
        description: 'Applies a function to each element and returns a new array.',
        example: 'map([1, 2, 3], (x) => x * 2)  // [2, 4, 6]'
    },
    'filter': {
        signature: 'filter(array, fn) -> array',
        description: 'Returns elements that pass the test function.',
        example: 'filter([1, 2, 3, 4], (x) => x > 2)  // [3, 4]'
    },
    'reduce': {
        signature: 'reduce(array, fn, initial) -> value',
        description: 'Reduces array to a single value using accumulator function.',
        example: 'reduce([1, 2, 3], (a, b) => a + b, 0)  // 6'
    },
    'random': {
        signature: 'random(min?, max?) -> number',
        description: 'Returns a random number. With no args: 0-1. With args: min-max.',
        example: 'random()  // 0.0 - 1.0\nrandom(1, 100)  // 1 - 100'
    },
    'floor': {
        signature: 'floor(n) -> number',
        description: 'Rounds a number down to the nearest integer.',
        example: 'floor(3.7)  // 3'
    },
    'ceil': {
        signature: 'ceil(n) -> number',
        description: 'Rounds a number up to the nearest integer.',
        example: 'ceil(3.2)  // 4'
    },
    'round': {
        signature: 'round(n) -> number',
        description: 'Rounds a number to the nearest integer.',
        example: 'round(3.5)  // 4'
    },
    'abs': {
        signature: 'abs(n) -> number',
        description: 'Returns the absolute value of a number.',
        example: 'abs(-5)  // 5'
    },
    'sqrt': {
        signature: 'sqrt(n) -> number',
        description: 'Returns the square root of a number.',
        example: 'sqrt(16)  // 4'
    },
    'pow': {
        signature: 'pow(base, exp) -> number',
        description: 'Returns base raised to the power of exp.',
        example: 'pow(2, 3)  // 8'
    },
    'sin': {
        signature: 'sin(radians) -> number',
        description: 'Returns the sine of an angle in radians.',
        example: 'sin(PI / 2)  // 1'
    },
    'cos': {
        signature: 'cos(radians) -> number',
        description: 'Returns the cosine of an angle in radians.',
        example: 'cos(0)  // 1'
    },
    'split': {
        signature: 'split(str, delimiter) -> array',
        description: 'Splits a string into an array by delimiter.',
        example: 'split("a,b,c", ",")  // ["a", "b", "c"]'
    },
    'join': {
        signature: 'join(array, delimiter) -> string',
        description: 'Joins array elements into a string.',
        example: 'join(["a", "b"], "-")  // "a-b"'
    },
    'push': {
        signature: 'push(array, value) -> array',
        description: 'Adds an element to the end of an array.',
        example: 'push([1, 2], 3)  // [1, 2, 3]'
    },
    'pop': {
        signature: 'pop(array) -> value',
        description: 'Removes and returns the last element of an array.',
        example: 'pop([1, 2, 3])  // 3'
    },
    'keys': {
        signature: 'keys(object) -> array',
        description: 'Returns an array of object keys.',
        example: 'keys({"a": 1, "b": 2})  // ["a", "b"]'
    },
    'values': {
        signature: 'values(object) -> array',
        description: 'Returns an array of object values.',
        example: 'values({"a": 1, "b": 2})  // [1, 2]'
    },
    'now': {
        signature: 'now() -> number',
        description: 'Returns the current timestamp in milliseconds.',
        example: 'let start = now()'
    },
    'delay': {
        signature: 'delay(ms) -> Promise',
        description: 'Pauses execution for the specified milliseconds.',
        example: 'await delay(1000)  // Wait 1 second'
    },
    'readFile': {
        signature: 'readFile(path) -> string',
        description: 'Reads and returns the contents of a file.',
        example: 'let content = readFile("data.txt")'
    },
    'writeFile': {
        signature: 'writeFile(path, content) -> boolean',
        description: 'Writes content to a file.',
        example: 'writeFile("out.txt", "Hello!")'
    },
    'fetch': {
        signature: 'fetch(url, options?) -> Promise',
        description: 'Makes an HTTP request and returns the response.',
        example: 'let data = await fetch("https://api.example.com")'
    },
    'uuid': {
        signature: 'uuid() -> string',
        description: 'Generates a random UUID v4 string.',
        example: 'let id = uuid()  // "550e8400-e29b-41d4-..."'
    },
    'clamp': {
        signature: 'clamp(value, min, max) -> number',
        description: 'Constrains a value between min and max.',
        example: 'clamp(15, 0, 10)  // 10'
    },
    'lerp': {
        signature: 'lerp(a, b, t) -> number',
        description: 'Linear interpolation between a and b by factor t.',
        example: 'lerp(0, 100, 0.5)  // 50'
    }
};

function getBuiltinDocumentation(name) {
    return BUILTIN_DOCS[name] || null;
}

module.exports = { activate, deactivate };
