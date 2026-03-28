# R Lists: Store Mixed Data Types — Create, Access, Modify & Convert

R lists hold any mix of data types — vectors, data frames, even other lists. Learn to create, access with [] vs [[]], modify, and convert lists efficiently.

## What Is an R List?

A list is R's most flexible data structure. Unlike vectors (which store one data type), a list can hold any combination of objects — numbers, strings, vectors, data frames, and even other lists. Think of a list as a named filing cabinet where each drawer can hold something completely different.

## Why Lists Matter

Real-world R programming depends on lists. When you run a linear model with `lm()`, it returns a list. When you fetch data from an API, you get a list. When you need to pass multiple objects between functions, you use a list. Understanding lists is not optional — it's essential.

## Creating Lists with list()

The `list()` function creates a list. You can mix any data types.

## Named Lists

Named lists let you label each element. This makes your code self-documenting and easier to work with.

## Accessing List Elements: [] vs [[]] vs $

This is where most beginners get confused. R has three ways to access list elements, and they do different things.

- `[]` returns a sub-list (still a list)
- `[[]]` extracts the element itself
- `$` extracts by name (shortcut for [[]])

## Modifying List Elements

You can add, change, or remove elements after creating a list.

## Nested Lists

Lists can contain other lists. This is how complex data structures work in R.

## Converting Lists to Other Structures

### List to Vector with unlist()

### List to Data Frame

## Iterating Over Lists with lapply and sapply

The `lapply()` function applies a function to every element and returns a list. `sapply()` simplifies the result to a vector when possible.

## Real-World Use Cases

### Working with Model Output

### Processing API-Style Data

## Practice Exercises

## FAQ

## Conclusion
