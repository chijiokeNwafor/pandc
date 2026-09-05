# pandc

## Local development

Use the Node version pinned in `.nvmrc` (requires nvm):

```sh
nvm install
nvm use
npm install
npm run dev
```

The VS Code `npm: dev` task loads nvm and selects this version automatically.
The project requires Node 22.13 or newer; Node 21 cannot run vinext because
it does not export `glob` from `node:fs/promises`.
