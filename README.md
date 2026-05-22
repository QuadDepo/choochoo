# choochoo

Dutch NS railway expense declaration automation via Playwright.

## Requirements

- Google Chrome installed locally (real Chrome, not Chromium — NS uses Akamai bot detection)
- Node.js >= 22

## Install

```sh
npm i -g @choochoo/cli
```

The package is published under the `@choochoo` scope; the installed binary is
`choochoo`.

## Quick start

Scaffold a config file at `~/.config/choochoo/config.json`:

```sh
choochoo init
```

Then run interactively:

```sh
choochoo
```

Or run non-interactively:

```sh
choochoo extract --period this-month
choochoo download --period this-month --select paid
```

Available periods: `this-month`, `previous-month`, `past-year`, `last-7-days`.

Selection modes for `download`: `paid` (non-zero-cost trips, default), `all`, or a
comma-separated list of trip numbers like `1,2,3`.

## Configuration

NS credentials are stored as plaintext in `~/.config/choochoo/config.json`. Only
run choochoo on trusted machines and ensure the config file has restrictive
permissions.

### Configuration file location

choochoo loads config from `./config.json` in the current working directory if
present, otherwise falls back to `~/.config/choochoo/config.json`. Running
`choochoo` from a directory containing a stray `config.json` will silently use
that file instead of your real one — prefer running from a neutral directory,
or remove the local file. The config holds your NS email and password in
plaintext (written with `0600` permissions); treat it as a secret and only use
it on a trusted machine.

## Project structure

choochoo is a Turborepo monorepo:

```
apps/cli/        # Published CLI — @choochoo/cli
packages/core/   # Internal Playwright wrapper — @choochoo/core (private)
```

`@choochoo/core` is bundled into the CLI at build time (via tsup `noExternal`)
and is not published. Only `@choochoo/cli` is consumed from npm.

## License

MIT
