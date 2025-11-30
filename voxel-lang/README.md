# VoxelScript 🟢

<p align="center">
  <img src="editor/assets/icon.svg" width="200" alt="VoxelScript Logo">
</p>

<p align="center">
  <strong>The Matrix Programming Language</strong><br>
  A modern, powerful language with immersive 3D code visualization
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#syntax">Syntax</a> •
  <a href="#built-in-functions">300+ Functions</a> •
  <a href="#3d-editor">3D Editor</a> •
  <a href="#vs-code">VS Code</a>
</p>

---

## ✨ Features

- 🎯 **Clean Syntax** - Python-like readability with JavaScript flexibility
- 🖥️ **3D Code Editor** - Watch your code float in 3D space with lightning execution
- 🌙 **Matrix Theme** - Pure black with neon green aesthetics
- 🚀 **300+ Built-in Functions** - Math, vectors, colors, files, networking, async & more
- 🎨 **Modern Language Features** - Classes, arrow functions, async/await, destructuring, enums
- 💻 **Cross-Platform** - Windows, macOS, and Linux
- 📦 **VS Code Extension** - Full syntax highlighting, snippets, and Matrix theme
- 🔄 **Auto-Updates** - Automatically checks for updates on startup

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

### Variables & Constants
```voxel
let name = "Neo"
const PI = 3.14159          // Immutable constant
let active = true
let items = [1, 2, 3, 4, 5]
let person = {name: "Neo", age: 30}
```

### Template Strings
```voxel
let name = "World"
let greeting = `Hello, ${name}!`
let math = `2 + 2 = ${2 + 2}`
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

// Arrow functions (single & multi param)
let double = x => x * 2
let add = (a, b) => a + b
let sayHi = () => "Hello!"
```

### Classes & Inheritance
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
    constructor(name, breed) {
        this.name = name
        this.breed = breed
    }
    
    speak() {
        return this.name + " barks!"
    }
}

let dog = new Dog("Rex", "German Shepherd")
print(dog.speak())  // Rex barks!
```

### Control Flow
```voxel
// If/else statements
if age >= 18 {
    print("Adult")
} else if age >= 13 {
    print("Teenager")
} else {
    print("Child")
}

// Ternary operator
let status = age >= 18 ? "adult" : "minor"

// Switch/Match
switch day {
    case 1:
        print("Monday")
        break
    case 2:
        print("Tuesday")
        break
    default:
        print("Other")
}

// For loops with range
loop i from 0 to 10 {
    print(i)
}

// Countdown with step
loop i from 10 to 0 step -1 {
    print(i)
}

// For-in loops
loop item in items {
    print(item)
}

// While loop
while running {
    // game logic
}

// Do-while loop
do {
    // runs at least once
} while condition

// Loop controls
loop item in items {
    if item == target { break }
    if item < 0 { continue }
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
// Array destructuring
let [first, second, ...rest] = [1, 2, 3, 4, 5]

// Object destructuring
let {name, age} = {name: "Neo", age: 30}

// With defaults
let [a = 0, b = 0] = [1]  // a=1, b=0
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
x -= 3
x *= 2
x /= 4
```

### Spread Operator
```voxel
let arr1 = [1, 2, 3]
let arr2 = [...arr1, 4, 5]  // [1, 2, 3, 4, 5]

let obj1 = {a: 1}
let obj2 = {...obj1, b: 2}  // {a: 1, b: 2}
```

### Enums
```voxel
enum Color {
    RED,
    GREEN,
    BLUE
}

enum HttpStatus {
    OK = 200,
    NOT_FOUND = 404,
    SERVER_ERROR = 500
}

print(Color.RED)        // 0
print(HttpStatus.OK)    // 200
```

### Range Expressions
```voxel
let range1 = 1..5        // [1, 2, 3, 4] (exclusive)
let range2 = 1..=5       // [1, 2, 3, 4, 5] (inclusive)

loop i in 1..10 {
    print(i)
}
```

### List Comprehensions
```voxel
let squares = [x * x for x in range(1, 6)]  // [1, 4, 9, 16, 25]
let evens = [x for x in range(1, 11) if x % 2 == 0]  // [2, 4, 6, 8, 10]
```

### Assert & Debug
```voxel
let x = 10
assert x > 0, "x must be positive"
debug x + 5  // [DEBUG] x + 5 = 15
```

---

## 🔧 Built-in Functions (300+)

### I/O
`print`, `input`, `readFile`, `writeFile`, `appendFile`, `deleteFile`, `exists`, `listDir`, `mkdir`, `copy`, `move`, `remove`

### Math (Basic)
`abs`, `floor`, `ceil`, `round`, `sqrt`, `pow`, `exp`, `log`, `log10`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `min`, `max`, `clamp`, `random`, `randInt`, `randFloat`

**Constants:** `PI`, `E`, `TAU`, `PHI`, `SQRT2`, `INF`

### Math (Advanced)
`factorial`, `fibonacci`, `isPrime`, `gcd`, `lcm`, `lerp`, `smoothstep`, `wrap`, `degToRad`, `radToDeg`

### Strings
`len`, `upper`, `lower`, `trim`, `ltrim`, `rtrim`, `split`, `join`, `replace`, `substr`, `indexOf`, `lastIndexOf`, `startsWith`, `endsWith`, `contains`, `repeat`, `reverse`, `capitalize`, `titleCase`, `camelCase`, `snakeCase`, `padStart`, `padEnd`, `charAt`

### String Formatting
```voxel
print(fmt("Hello, {}!", "World"))
print(format("Pi: {:.2f}", 3.14159))
print(sprintf("Value: %d, Float: %.2f", 42, 3.14))
```

### Arrays
`push`, `pop`, `shift`, `unshift`, `slice`, `concat`, `sort`, `reverse`, `shuffle`, `unique`, `flat`, `chunk`, `first`, `last`, `sample`, `range`

### Functional Programming
`map`, `filter`, `reduce`, `forEach`, `find`, `findIndex`, `every`, `some`, `none`, `compose`, `pipe`, `curry`, `memoize`, `debounce`, `throttle`, `once`

### Objects
`keys`, `values`, `entries`, `has`, `get`, `set`, `delete`, `merge`, `clone`, `pick`, `omit`

### Type Operations
`type`, `num`, `int`, `float`, `str`, `bool`, `array`, `isNum`, `isStr`, `isBool`, `isArray`, `isObject`, `isNull`, `isNaN`, `isEmpty`

### Date/Time
`now`, `time`, `date`, `datetime`, `timestamp`, `year`, `month`, `day`, `hour`, `minute`, `second`, `formatDate`, `parseDate`, `sleep`, `wait`

### Async/Await
```voxel
let results = await all([promise1, promise2])
let first = await race([promise1, promise2])
let result = await timeout(promise, 5000, "Timed out!")
let data = await retry(fetchData, 3, 1000)  // 3 attempts

let debouncedFn = debounce(myFunc, 300)
let throttledFn = throttle(myFunc, 1000)
```

### HTTP/Networking
`fetch`, `get`, `post`, `request`

### Utility
`uuid`, `randomId`, `hash`, `base64Encode`, `base64Decode`, `json`, `parse`, `exec`, `exit`, `env`, `platform`

### Python-Style Functions
```voxel
loop item in enumerate(items) {
    print(item[0] + ": " + item[1])  // index: value
}

let zipped = zip([1, 2, 3], ["a", "b", "c"])
let total = sum([1, 2, 3, 4, 5])  // 15
let byAge = sorted(users, "age")
let combined = chain([1, 2], [3, 4])  // [1, 2, 3, 4]
let combos = combinations([1, 2, 3], 2)
```

### Vectors (2D/3D)
```voxel
let pos = vec2(100, 200)
let vel = vec3(5, -3, 0)

let sum = vecAdd(pos, vel)
let scaled = vecMul(vel, 2)
let magnitude = vecMag(vel)
let normalized = vecNorm(vel)
let distance = vecDist(pos, target)
let interpolated = vecLerp(pos, target, 0.5)
let rotated = vecRotate(vel, PI / 4)
```

### Colors (CSS-Style)
```voxel
let red = rgb(255, 0, 0)
let semiTransparent = rgba(0, 255, 0, 0.5)
let blue = hsl(240, 100, 50)
let purple = hex("#8800FF")

let lighter = lighten(red, 50)
let darker = darken(blue, 30)
let gray = grayscale(purple)
let blended = mix(red, blue, 0.5)
let hexColor = toHex(rgb(255, 128, 0))  // "#ff8000"
```

### Noise & Procedural
```voxel
let n = noise(x, y)  // Perlin noise -1 to 1
let terrain = fbm(x, y, 4, 2, 0.5)  // Fractal Brownian Motion
```

### Statistics
```voxel
let avg = mean([1, 2, 3, 4, 5])  // 3
let mid = median([1, 2, 3, 4, 100])  // 3
let common = mode([1, 2, 2, 3, 3, 3])  // 3
let spread = stddev([1, 2, 3, 4, 5])
```

### Easing Functions (Animation)
```voxel
let t = easeInQuad(progress)
let t = easeOutCubic(progress)
let t = easeInOutElastic(progress)
let t = easeOutBounce(progress)
```

---

## 🖥️ 3D Code Editor

VoxelScript includes a unique **immersive 3D code editor** with lightning execution visualization!

### Launch the Editor
```bash
cd voxel-lang/editor
npm install
npm start
```

### Features
- 📦 **Floating Code Blocks** - Each line as a 3D element drifting in space
- ⚡ **Lightning Execution** - Watch lightning bolts connect lines as code runs
- 🌀 **Chaotic Motion** - Blocks orbit, drift, and rotate independently
- 🌧️ **Matrix Rain** - Atmospheric particle effects
- 🎬 **Full-screen 3D Mode** - Press `3` to toggle
- ⌨️ **Execute with Space/Enter** - Run code and see the lightning show

### Controls
- **Scroll** - Navigate through code vertically
- **Drag** - Rotate camera around code
- **Space/Enter** - Execute code with lightning visualization
- **Double-click** - Execute code
- **3** - Toggle full 3D view
- **Escape** - Close 3D window

---

## 🎨 VS Code Extension

Full language support for Visual Studio Code:

### Install
```bash
cd voxelscript-vscode
npm install
npx vsce package
```

Then in VS Code: `Ctrl+Shift+P` → "Install from VSIX"

### Features
- ✅ Syntax highlighting
- ✅ 50+ code snippets
- ✅ Run with F5
- ✅ Matrix color theme
- ✅ Bracket matching
- ✅ Auto-completion

---

## 📁 Examples

### Calculator
```voxel
fn add(a, b) { return a + b }
fn sub(a, b) { return a - b }
fn mul(a, b) { return a * b }
fn div(a, b) { return a / b }

print("5 + 3 = " + str(add(5, 3)))
print("5 * 3 = " + str(mul(5, 3)))
```

### Fibonacci
```voxel
fn fib(n) {
    if n <= 1 { return n }
    return fib(n - 1) + fib(n - 2)
}

loop i in range(0, 10) {
    print("fib(" + str(i) + ") = " + str(fib(i)))
}
```

### FizzBuzz
```voxel
loop i in range(1, 101) {
    if i % 15 == 0 {
        print("FizzBuzz")
    } else if i % 3 == 0 {
        print("Fizz")
    } else if i % 5 == 0 {
        print("Buzz")
    } else {
        print(i)
    }
}
```

### HTTP Request
```voxel
let response = await fetch("https://api.github.com")
print(response)
```

### File Operations
```voxel
writeFile("test.txt", "Hello, VoxelScript!")
let content = readFile("test.txt")
print(content)
```

### Simple Game
```voxel
let player = createSprite(400, 300, 32, 32, rgb(0, 255, 0))
let score = 0

while player.visible {
    if isKeyDown("ArrowLeft") {
        moveSprite(player, -5, 0)
    }
    if isKeyDown("ArrowRight") {
        moveSprite(player, 5, 0)
    }
    
    score++
    wait(16)  // ~60 FPS
}

print("Final Score: " + score)
```

---

## 🔄 Auto-Updates

The 3D editor automatically checks for updates on startup and every 30 minutes. When an update is available, you'll be prompted to restart and install.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Welcome to the Matrix! 🟢</strong><br>
  <sub>Created by <a href="https://github.com/qulyttvv-beep">qulyttvv-beep</a></sub>
</p>
