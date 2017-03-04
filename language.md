# Prismat language
Prismat is language created for creating language like patterns and manipulation of data.

Using prismat you can create your own programing languages or more specificly transpilers for your dreamed language or to add extra features to your daily use language and make if even better than is it rigth now.

## tokenizer
Goal of tokenizer is to split file into tokens and groups of tokens and also to determinate meaning of tokens.

You can controle tokenizer using `break`, `if` and `let` instructions.

### token
Token is the smallest groped part of file.

Tokens have two properties:
- `text` witch is content of `token`.
- `tags` witch is by default empty `array`, tags can be added by `let` instruction.
#### data structure
```typescript
{
    text: String,
    tags: Array<String>
}
```
Tokens can be groped into `tokens grop` using `let group`.

### tokens group
Token group is array of `token` and `tokens group`.

Tokens have two properties:
- `tokens` witch is content of `tokens group`.
- `tags` witch is by default empty array, tags can be added by `let` instruction.

`Tokens group` can be expanded using `let expand group`.

#### data structure
```typescript
{
    tokens: Array<Token>,
    tags: Array<String>
}
```

## instructions

### break on
This instruction tells tokenizer when to stop joining letters into token and run `if` and `let` instructions.

This instruction can be specified only once.

If not specfied /\W/ will be used by default.
#### syntax
```
break on /regex/
```

#### NOTE
Regular expresion specified after `break on` will be testing **evry character of file so keep it simple**.

### define
`definde` instruction defines local javascrip varibles inside tokenizer.

### if

#### syntax
```
if test then action
```

### let


## tests

| test     | explanation |
| -------- | ----------- |
| `'test'` | check equality of strings |
| `/test/` | check if pointed string satisfies regex |
| `#test`  | check if pointed `token` or `tokens group` has specific tag |
| `[(js code)]`  | evaluates javascrip code |
| `varibleName`  | evaluates javascrip varible to boolean |

## Operators

| operator            | role                |
| ------------------- | ------------------- |
| [test] `<-`         | test previous `token` |
| `->` [test]         | test next `character` |
| [test] `&&` [test]  | check if first `and` second test finished successfully |
| [test] `||` [test]  | check if first `or` second test finished successfully |
| [action] `,` [action] | used to separate execute multiple actions  |

## Line comments

to start line coment just put `~` at begining of line

*example*
```
~ this if matches allows matching content of string
if [(matchingString)] then continue
```

<!-- let be|be group|expand group|throw| --!>