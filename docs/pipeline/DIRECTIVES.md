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

## Running generated notebooks

Generated notebooks execute under the `xcpp17` kernel (xeus-cpp). Before executing a notebook, ensure the kernel is installed and then use `jupyter nbconvert` to run headless.

Check that the kernel is available:
```bash
jupyter kernelspec list | grep -i xcpp
```

If absent, install xeus-cpp:
```bash
mamba install -c conda-forge xeus-cpp
```

Execute a generated notebook headless:
```bash
jupyter nbconvert --to notebook --execute --inplace ../ds2026/notebooks/chap03_stacks_queues_modern_cpp.ipynb
```

**Cling redefinition constraint:** only code fences tagged `<!-- runnable -->` become executable cells. Each type and `main()` must be defined in at most one runnable cell; execution fails if violated. To fix, remove `<!-- runnable -->` from the colliding fence and regenerate with `node pipeline/gen-ipynb.js <chapter.md>`.
