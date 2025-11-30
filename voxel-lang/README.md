# VoxelScript 🟢

<p align="center">
  <img src="editor/assets/icon.svg" width="200" alt="VoxelScript Logo">
</p>

<p align="center">
  <strong>The Matrix Programming Language</strong><br>
  A simple, powerful language with 3D code visualization
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#syntax">Syntax</a> •
  <a href="#3d-editor">3D Editor</a> •
  <a href="#vs-code">VS Code</a>
</p>

---

## ✨ Features

- 🎯 **Simple Syntax** - Easy to learn, powerful to use
- 🖥️ **3D Code Editor** - Watch your code float in 3D space
- 🌙 **Matrix Theme** - Pure black with neon green aesthetics
- 🚀 **300+ Built-in Functions** - Math, strings, arrays, files, networking & more
- 🎨 **Modern Language Features** - Classes, arrow functions, async/await, destructuring
- 💻 **Cross-Platform** - Windows, macOS, and Linux
- 📦 **VS Code Extension** - Syntax highlighting, snippets, and Matrix theme

---

## 📦 Installation

### Windows

```powershell
git clone https://github.com/qulyttvv-beep/voxelscript.git
cd voxelscript/voxel-lang
.\install-windows.bat
```

After installation:
- ✅ **Double-click** any `.voxel` file to run it
- ✅ **Right-click** → "Run Script" on `.voxel` files  
- ✅ Type `voxel` in any terminal

### macOS / Linux

```bash
git clone https://github.com/qulyttvv-beep/voxelscript.git
cd voxelscript/voxel-lang
chmod +x install.sh
./install.sh
```

### npm (Global)

```bash
npm install -g voxelscript
```

---

## 🚀 Quick Start

```bash
# Start REPL
voxel

# Run a script
voxel hello.voxel

# Run code directly
voxel -e "print 'Hello, Matrix!'"

# Show help
voxel --help
```

### Hello World

Create `hello.voxel`:
```voxel
print "Hello, Matrix!"
```

Run it:
```bash
voxel hello.voxel
```

---

## 📖 Syntax

### Variables
```voxel
let name = "Neo"
const PI = 3.14159
let active = true
let items = [1, 2, 3, 4, 5]
let person = {name: "Neo", age: 30}
```

### Template Strings
```voxel
let name = "World"
let greeting = `Hello, ${name}!`
print(greeting)  // Hello, World!
```

### Functions
```voxel
fn greet(name) {
    return "Hello, " + name + "!"
}

// Default parameters
fn greetWithDefault(name = "Guest") {
    return "Hello, " + name + "!"
}

// Rest parameters
fn sum(...numbers) {
    let total = 0
    loop n in numbers { total += n }
    return total
}

// Arrow functions
let double = x => x * 2
let add = (a, b) => a + b
```

### Classes
```voxel
class Animal {
    constructor(name) {
        this.name = name
    }
    
    speak() {
        return this.name + " makes a sound"
    }
}

class Dog extends Animal {
    speak() {
        return this.name + " barks!"
    }
}

let dog = new Dog("Rex")
print(dog.speak())  // Rex barks!
```

### Control Flow
```voxel
// If statements
if age >= 18 {
    print("Adult")
} else if age >= 13 {
    print("Teenager")
} else {
    print("Child")
}

// Ternary
let status = age >= 18 ? "adult" : "minor"

// Switch/Match
switch day {
    case 1:
        print("Monday")
        break
    default:
        print("Other")
}

// Loops
loop i from 0 to 10 {
    print(i)
}

loop item in items {
    print(item)
}

while running {
    // code
}

// Loop with step
loop i from 10 to 0 step -1 {
    print(i)  // Countdown
}
```

### Error Handling
```voxel
try {
    throw "Something went wrong"
} catch(e) {
    print("Error: " + e)
} finally {
    print("Cleanup")
}
```

### Destructuring
```voxel
let [first, second, ...rest] = [1, 2, 3, 4, 5]
let {name, age} = {name: "Neo", age: 30}
```

### Modern Operators
```voxel
// Nullish coalescing
let value = null ?? "default"

// Optional chaining
let name = user?.profile?.name

// Pipe operator
let result = 5 |> double |> addTen

// Increment/Decrement
count++
count--

// Compound assignment
x += 5
```

### Arrays
```voxel
let numbers = [1, 2, 3, 4, 5]

let doubled = map(numbers, x => x * 2)         // [2, 4, 6, 8, 10]
let evens = filter(numbers, x => x % 2 == 0)   // [2, 4]
let sum = reduce(numbers, (a, b) => a + b, 0)  // 15

// Spread operator
let combined = [...arr1, ...arr2]
```

### Objects
```voxel
let person = {"name": "Neo", "role": "The One"}
let k = keys(person)    // ["name", "role"]
let v = values(person)  // ["Neo", "The One"]
```

---

## 🔧 Built-in Functions (200+)

### I/O
`print`, `input`, `readFile`, `writeFile`, `appendFile`, `deleteFile`, `exists`

### Math
`abs`, `floor`, `ceil`, `round`, `sqrt`, `pow`, `sin`, `cos`, `tan`, `random`, `clamp`, `lerp`, `factorial`, `fibonacci`, `isPrime`, `gcd`, `lcm`

### Strings
`len`, `upper`, `lower`, `trim`, `split`, `join`, `replace`, `substr`, `indexOf`, `startsWith`, `endsWith`, `repeat`, `reverse`, `capitalize`

### Arrays
`push`, `pop`, `shift`, `slice`, `map`, `filter`, `reduce`, `forEach`, `find`, `sort`, `unique`, `flatten`, `chunk`, `shuffle`, `sum`, `avg`, `median`

### Functional
`compose`, `pipe`, `curry`, `memoize`, `debounce`, `throttle`, `once`

### Async
`delay`, `fetch`, `get`, `post`, `parallel`, `sequence`, `retry`

### System
`now`, `date`, `uuid`, `hash`, `exec`, `exit`, `env`, `platform`

---

## 🖥️ 3D Editor

VoxelScript includes a unique 3D code editor!

```bash
cd voxel-lang/editor
npm install
npm start
```

Features:
- 📦 Code lines as floating 3D cubes
- ⚡ Real-time execution visualization
- 🌧️ Matrix rain background
- ✨ Particle effects
- 🎬 Full-screen 3D mode (press `3`)

---

## 🎨 VS Code Extension

Full language support for VS Code:

```bash
cd voxelscript-vscode
npm install
npx vsce package
```

Then in VS Code: `Ctrl+Shift+P` → "Install from VSIX"

Features:
- Syntax highlighting
- 50+ code snippets
- Run with F5
- Matrix color theme

---

## 📁 Examples

### Calculator
```voxel
fn add(a, b) { return a + b }
fn sub(a, b) { return a - b }
fn mul(a, b) { return a * b }
fn div(a, b) { return a / b }

print "5 + 3 = " + str(add(5, 3))
print "5 * 3 = " + str(mul(5, 3))
```

### Fibonacci
```voxel
fn fib(n) {
    if n <= 1 { return n }
    return fib(n - 1) + fib(n - 2)
}

for i in range(0, 10) {
    print "fib(" + str(i) + ") = " + str(fib(i))
}
```

### HTTP Request
```voxel
let response = await fetch("https://api.github.com")
print response
```

### File Operations
```voxel
writeFile("test.txt", "Hello, VoxelScript!")
let content = readFile("test.txt")
print content
```

---

## 📄 License

MIT License

---

<p align="center">
  <strong>Welcome to the Matrix! 🟢</strong>
</p>
