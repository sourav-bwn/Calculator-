# Calculator

A simple calculator built with plain HTML, CSS and JavaScript in a single `index.html` - no build step, no dependencies.

## Use

Open `index.html` in any browser (double-click it), or serve the folder:

```bash
python3 -m http.server 8000
```

## Tests

Offline regression tests for the calculator logic (Node 18+, no dependencies):

```bash
node --test tests/calculator.test.cjs
```
