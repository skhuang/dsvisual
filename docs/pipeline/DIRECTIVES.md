# Lecture Directive Reference

Directives are HTML comments — invisible in Marp render, parsed by the pipeline.

| Directive | Placement | Effect |
|---|---|---|
| `<!-- code: FILE -->` | line above a code fence | the code is the canonical `cpp/FILE`; generators pull from the single source |
| `<!-- code: FILE#SECTION -->` | line above a code fence | pull only the marked section (`// >>> SECTION` … `// <<< SECTION`) |
| `<!-- runnable -->` | line above a `cpp` fence | this becomes an executable xcpp17 cell in the notebook |
| `<!-- viz: ID -->` | anywhere in a slide | binds to the dsvisual interactive viz `ID` |
| `<!-- oj: ID "TITLE" -->` | exercise section | binds to OJ problem `ID`; title optional |

The consistency linter (`pipeline/lint.js`) fails if any `code`/`viz`/`oj`
target does not exist.
