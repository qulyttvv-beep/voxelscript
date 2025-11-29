# VoxelScript for VS Code

The official Visual Studio Code extension for **VoxelScript** - the 3D Matrix-style programming language.

## Features

### 🎨 Syntax Highlighting
Full syntax highlighting for VoxelScript with the Matrix green theme.

- Keywords (if, else, loop, while, for, fn, let, const, etc.)
- Built-in functions (print, map, filter, reduce, etc.)
- Strings, numbers, comments
- Functions and variables

### 📝 Code Snippets
Quick snippets for common patterns:

| Prefix | Description |
|--------|-------------|
| `fn` | Function declaration |
| `if` | If statement |
| `ife` | If-else statement |
| `loop` | Loop statement |
| `while` | While loop |
| `for` | For-in loop |
| `let` | Variable declaration |
| `print` | Print statement |
| `main` | Main program template |
| `gameloop` | Game loop template |

### 🖥️ Run Scripts
Press `F5` to run your VoxelScript directly in VS Code.

### 🎯 IntelliSense
- Auto-completion for keywords and built-in functions
- Hover documentation for built-ins
- Parameter hints

### 🌙 Matrix Theme
Includes the "VoxelScript Matrix" color theme - pure black background with neon green code.

## Installation

### From VSIX (Local Install)

1. Download or build the `.vsix` file
2. Open VS Code
3. Press `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
4. Select the `.vsix` file

### Build from Source

```bash
cd voxelscript-vscode
npm install
npx vsce package
```

## Configuration

### Settings

- `voxelscript.interpreterPath`: Path to the VoxelScript interpreter (voxel.js)
- `voxelscript.editorPath`: Path to the VoxelScript 3D Editor
- `voxelscript.showOutputOnRun`: Auto-show output panel when running

### Example settings.json

```json
{
  "voxelscript.interpreterPath": "C:/path/to/voxel-lang/voxel.js",
  "voxelscript.showOutputOnRun": true
}
```

## File Extensions

- `.voxel` - VoxelScript source files
- `.vxl` - VoxelScript source files (short form)

## Keyboard Shortcuts

| Key | Command |
|-----|---------|
| `F5` | Run VoxelScript |

## Theme

To use the Matrix theme:
1. Press `Ctrl+K Ctrl+T`
2. Select "VoxelScript Matrix"

## Language Examples

```voxelscript
// Hello World
print "Hello, Matrix!"

// Variables
let name = "Neo"
let age = 30

// Functions
fn greet(person) {
    print "Hello, " + person + "!"
}

greet(name)

// Loops
for i in range(0, 10) {
    print i
}

// Arrays
let numbers = [1, 2, 3, 4, 5]
let doubled = map(numbers, (x) => x * 2)
print doubled  // [2, 4, 6, 8, 10]
```

## Links

- [VoxelScript Language](https://github.com/voxelscript)
- [VoxelScript 3D Editor](https://github.com/voxelscript/editor)

## License

MIT License - See LICENSE file

---

**Enjoy coding in the Matrix!** 🟢
