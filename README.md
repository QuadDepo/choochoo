# choochoo

Dutch NS railway expense declaration automation via Playwright.

## Requirements

- Google Chrome installed locally (real Chrome, not Chromium — NS uses Akamai bot detection)
- Node.js >= 22

## Install

```sh
npm i -g choochoo
```

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

Available periods: `this-month`, `last-month`, `past-year`, `last-7-days`.

Selection modes for `download`: `paid` (non-zero-cost trips, default), `all`, or a
comma-separated list of trip numbers like `1,2,3`.

## Configuration

NS credentials are stored as plaintext in `~/.config/choochoo/config.json`. Only
run choochoo on trusted machines and ensure the config file has restrictive
permissions.

## License

MIT
