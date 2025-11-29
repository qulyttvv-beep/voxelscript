# VoxelScript - GitHub Copilot Instructions

## What is VoxelScript?

VoxelScript is a modern, dynamically-typed programming language designed for game development, 3D graphics, and general-purpose programming. It has a clean, readable syntax inspired by Python and JavaScript, with over 300 built-in functions.

**Repository**: https://github.com/qulyttvv-beep/voxelscript

## Quick Syntax Reference

### Variables
```voxel
let name = "VoxelScript"
let age = 25
let pi = 3.14159
let isAwesome = true
let items = [1, 2, 3, 4, 5]
let player = {name: "Hero", health: 100, position: {x: 0, y: 0}}
```

### Functions
```voxel
fn greet(name) {
    return "Hello, " + name + "!"
}

fn add(a, b) {
    return a + b
}

// Arrow-style functions work too
let double = fn(x) { return x * 2 }
```

### Control Flow
```voxel
// If statements
if score > 100 {
    print("High score!")
} else if score > 50 {
    print("Good job!")
} else {
    print("Keep trying!")
}

// Loops
loop i in range(10) {
    print(i)
}

// While loops
while health > 0 {
    // game logic
}

// Loop controls
loop item in items {
    if item == target {
        break
    }
    if item < 0 {
        continue
    }
}
```

### Print Output
```voxel
print("Hello World!")
print(42)
print(player.name)
```

### User Input
```voxel
let name = input("What's your name? ")
```

## Built-in Functions by Category

### Math (Basic)
- `abs(x)`, `floor(x)`, `ceil(x)`, `round(x)`
- `sqrt(x)`, `pow(x, y)`, `exp(x)`, `log(x)`, `log10(x)`
- `sin(x)`, `cos(x)`, `tan(x)`, `asin(x)`, `acos(x)`, `atan(x)`, `atan2(y, x)`
- `min(a, b)`, `max(a, b)`, `clamp(min, val, max)`
- `random()`, `randInt(min, max)`, `randFloat(min, max)`
- Constants: `PI`, `E`, `TAU`, `PHI`, `SQRT2`, `INF`

### Strings
- `len(s)`, `upper(s)`, `lower(s)`, `trim(s)`
- `split(s, delim)`, `join(arr, delim)`
- `replace(s, old, new)`, `contains(s, sub)`
- `startsWith(s, sub)`, `endsWith(s, sub)`
- `slice(s, start, end)`, `charAt(s, i)`
- `capitalize(s)`, `titleCase(s)`, `camelCase(s)`, `snakeCase(s)`
- `padStart(s, len)`, `padEnd(s, len)`, `repeat(s, n)`

### Arrays
- `push(arr, item)`, `pop(arr)`, `shift(arr)`, `unshift(arr, item)`
- `slice(arr, start, end)`, `concat(arr1, arr2)`
- `sort(arr)`, `reverse(arr)`, `shuffle(arr)`
- `unique(arr)`, `flat(arr)`, `chunk(arr, size)`
- `first(arr)`, `last(arr)`, `sample(arr, n)`
- `range(start, end, step)` - Generate number sequences

### Functional
- `map(arr, fn)`, `filter(arr, fn)`, `reduce(arr, fn, init)`
- `find(arr, fn)`, `findIndex(arr, fn)`
- `every(arr, fn)`, `some(arr, fn)`, `none(arr, fn)`
- `forEach(arr, fn)`

### Objects
- `keys(obj)`, `values(obj)`, `entries(obj)`
- `has(obj, key)`, `get(obj, path, default)`
- `set(obj, path, value)`, `delete(obj, key)`
- `merge(obj1, obj2)`, `clone(obj)`
- `pick(obj, ...keys)`, `omit(obj, ...keys)`

### Type Conversion & Checking
- `num(x)`, `int(x)`, `float(x)`, `str(x)`, `bool(x)`, `array(x)`
- `type(x)`, `isNum(x)`, `isStr(x)`, `isBool(x)`, `isArray(x)`, `isObject(x)`
- `isEmpty(x)`, `isNull(x)`, `isNaN(x)`

### Date/Time
- `now()`, `time()`, `date()`, `datetime()`, `timestamp()`
- `year()`, `month()`, `day()`, `hour()`, `minute()`, `second()`
- `formatDate(timestamp, format)`, `parseDate(string)`
- `sleep(ms)`, `wait(ms)`

### File Operations
- `readFile(path)`, `writeFile(path, content)`, `appendFile(path, content)`
- `exists(path)`, `listDir(path)`, `mkdir(path)`
- `remove(path)`, `copy(src, dest)`, `move(src, dest)`

### Utility
- `print(...args)`, `log(...args)`, `error(...args)`, `warn(...args)`
- `json(obj)`, `parse(jsonString)`
- `uuid()`, `randomId(length)`, `hash(string)`
- `base64Encode(s)`, `base64Decode(s)`

## Python-Style Functions

```voxel
// List comprehension helper
let squares = listcomp(range(10), fn(x) { return x * x })

// Enumerate with index
loop item in enumerate(items) {
    let index = item[0]
    let value = item[1]
    print(index + ": " + value)
}

// Zip arrays together
let zipped = zip([1, 2, 3], ["a", "b", "c"])  // [[1, "a"], [2, "b"], [3, "c"]]

// All/Any
let allPositive = all(map(numbers, fn(n) { return n > 0 }))
let hasNegative = any(map(numbers, fn(n) { return n < 0 }))

// Sum and Product
let total = sum([1, 2, 3, 4, 5])  // 15
let factorial = product(range(1, 6))  // 120

// Sorted with key
let byAge = sorted(users, "age")
let byName = sorted(users, fn(u) { return u.name })

// Dict operations
let dict = dict([["a", 1], ["b", 2]])
let value = dictGet(dict, "c", 0)  // Returns 0 if not found

// String methods
let stripped = strip("  hello  ")  // "hello"
let centered = center("hi", 10)    // "    hi    "
let filled = zfill("42", 5)        // "00042"

// Itertools style
let combined = chain([1, 2], [3, 4], [5, 6])  // [1, 2, 3, 4, 5, 6]
let combos = combinations([1, 2, 3], 2)  // [[1,2], [1,3], [2,3]]
let perms = permutations([1, 2, 3])  // All permutations
```

## CSS-Style Color Functions

```voxel
// Create colors
let red = rgb(255, 0, 0)
let semiTransparent = rgba(0, 255, 0, 0.5)
let blue = hsl(240, 100, 50)
let purple = hex("#8800FF")

// Color manipulation
let lighter = lighten(red, 50)
let darker = darken(blue, 30)
let gray = grayscale(purple)
let inverted = invert(red)
let blended = mix(red, blue, 0.5)  // Purple!
let faded = alpha(red, 0.3)

// Convert to hex
let hexColor = toHex(rgb(255, 128, 0))  // "#ff8000"
```

## SDL2-Style Graphics

```voxel
// Create window/screen
let window = createWindow("My Game", 800, 600)

// Drawing primitives
let point = drawPoint(100, 100, rgb(255, 255, 255))
let line = drawLine(0, 0, 800, 600, rgb(0, 255, 0), 2)
let rect = drawRect(50, 50, 100, 100, rgb(255, 0, 0), true)
let circle = drawCircle(400, 300, 50, rgb(0, 0, 255), true)
let text = drawText("Score: 100", 10, 10, rgb(255, 255, 255), 24)

// Sprites (game objects)
let player = createSprite(100, 100, 32, 32, rgb(0, 255, 0))
setVelocity(player, 5, 0)
setAcceleration(player, 0, 0.5)  // Gravity

// Update physics
loop {
    updateSprite(player, 1)  // Apply velocity and acceleration
    
    // Collision detection
    if collides(player, enemy) {
        print("Hit!")
    }
}

// Input handling
let input = createInput()
if isKeyDown(input, "ArrowLeft") {
    moveSprite(player, -5, 0)
}

// Audio
let sound = createSound("explosion.wav")
playSound(sound)
setVolume(sound, 0.5)

// Scenes
let mainMenu = createScene("menu")
let gameLevel = createScene("game")
addToScene(gameLevel, player)
addToScene(gameLevel, enemy)
```

## Extended Math Library

### Vectors
```voxel
// 2D Vectors
let pos = vec2(100, 200)
let vel = vec2(5, -3)

// Vector operations
let newPos = vecAdd(pos, vel)
let scaled = vecMul(vel, 2)
let magnitude = vecMag(vel)
let normalized = vecNorm(vel)
let distance = vecDist(pos, target)
let interpolated = vecLerp(pos, target, 0.5)
let rotated = vecRotate(vel, PI / 4)
let angle = vecAngle(vel)

// 3D Vectors
let pos3d = vec3(10, 20, 30)
let cross = vecCross(vec3(1, 0, 0), vec3(0, 1, 0))
let dot = vecDot(pos3d, vel3d)
```

### Matrices (4x4 for 3D)
```voxel
let identity = mat4Identity()
let translation = mat4Translate(10, 20, 30)
let scale = mat4Scale(2, 2, 2)
let rotationX = mat4RotateX(PI / 4)
let combined = mat4Mul(translation, rotationX)
let perspective = mat4Perspective(degToRad(45), 16/9, 0.1, 1000)
let view = mat4LookAt(eye, target, vec3(0, 1, 0))
```

### Complex Numbers
```voxel
let c1 = complex(3, 4)  // 3 + 4i
let c2 = complex(1, 2)
let sum = complexAdd(c1, c2)
let product = complexMul(c1, c2)
let magnitude = complexAbs(c1)  // 5
let conjugate = complexConj(c1)  // 3 - 4i
```

### Quaternions (3D Rotations)
```voxel
let q = quatFromAxisAngle(vec3(0, 1, 0), PI / 2)  // 90° around Y
let rotatedPoint = quatRotateVec(q, vec3(1, 0, 0))
let interpolated = quatSlerp(q1, q2, 0.5)
```

### Noise & Procedural Generation
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

### Utility Math
```voxel
let interpolated = lerp(0, 100, 0.5)  // 50
let smooth = smoothstep(0, 1, 0.5)
let wrapped = wrap(angle, 0, TAU)
let radians = degToRad(90)
let degrees = radToDeg(PI)
```

## Example Programs

### Hello World
```voxel
print("Hello, VoxelScript!")
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

### Simple Calculator
```voxel
fn calculate(a, op, b) {
    if op == "+" { return a + b }
    if op == "-" { return a - b }
    if op == "*" { return a * b }
    if op == "/" { return a / b }
    if op == "^" { return pow(a, b) }
    return null
}

let a = num(input("Enter first number: "))
let op = input("Enter operator (+, -, *, /, ^): ")
let b = num(input("Enter second number: "))
print("Result: " + calculate(a, op, b))
```

### Simple Game Loop
```voxel
let player = createSprite(400, 300, 32, 32, rgb(0, 255, 0))
let enemies = []
let score = 0

// Spawn enemies
loop i in range(5) {
    let enemy = createSprite(randInt(0, 800), randInt(0, 600), 24, 24, rgb(255, 0, 0))
    setVelocity(enemy, randFloat(-2, 2), randFloat(-2, 2))
    push(enemies, enemy)
}

// Game loop
while player.visible {
    // Update enemies
    loop enemy in enemies {
        updateSprite(enemy, 1)
        
        // Bounce off walls
        if enemy.x < 0 or enemy.x > 800 {
            enemy.velocity.x = enemy.velocity.x * -1
        }
        if enemy.y < 0 or enemy.y > 600 {
            enemy.velocity.y = enemy.velocity.y * -1
        }
        
        // Check collision
        if collides(player, enemy) {
            print("Game Over! Score: " + score)
            player.visible = false
        }
    }
    
    score = score + 1
    wait(16)  // ~60 FPS
}
```

### File Processing
```voxel
let data = readFile("data.txt")
let lines = splitlines(data)
let numbers = map(lines, fn(line) { return num(trim(line)) })
let total = sum(numbers)
print("Total: " + total)
print("Average: " + mean(numbers))
```

## Tips for Copilot

1. **VoxelScript uses `let` for variable declarations** - Not `var`, `const`, or bare declarations
2. **Functions use `fn` keyword** - Not `function`, `def`, or `func`
3. **Loops use `loop` and `in`** - Example: `loop item in array { }`
4. **Braces are required** - No colon-based blocks like Python
5. **Semicolons are optional** - Line breaks work as statement terminators
6. **String concatenation uses `+`** - Template literals not supported
7. **Array access uses brackets** - `arr[0]`, `obj["key"]`, or `obj.key`
8. **Return is explicit** - Functions need `return` statement

## Running VoxelScript

```bash
# Run a file
voxel script.voxel

# Interactive mode
voxel -i

# Check version
voxel --version
```

---

Created by qulyttvv-beep | https://github.com/qulyttvv-beep/voxelscript
