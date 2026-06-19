# ttsg — Google Cloud Text-to-Speech CLI

A NestJS-powered command-line tool for synthesizing speech with Google Cloud Text-to-Speech. Run an interactive terminal UI or use non-interactive subcommands for scripting and automation.

## Features

- Interactive TUI with menus for synthesis, batch processing, file management, and settings
- Non-interactive subcommands: `synthesize`, `batch`, `voices`, `files`
- Parallel batch synthesis with configurable concurrency (`p-limit`)
- Persisted user preferences (voice, format, rate, pitch, output directory)
- Typed configuration with Joi validation at startup
- Docker support with credential and output volume mounts

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/)
- A Google Cloud project with the [Cloud Text-to-Speech API](https://cloud.google.com/text-to-speech) enabled
- A service account JSON key with Text-to-Speech permissions

## GCP Setup

1. Create or select a GCP project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Cloud Text-to-Speech API** for your project.
3. Create a service account with the **Cloud Text-to-Speech API User** role (or a custom role with `texttospeech.*` permissions).
4. Download the service account JSON key and save it locally (e.g. `./credentials/service-account.json`).

## Installation

```bash
pnpm install
cp .env.example .env
```

Edit `.env` with your project ID and credentials path.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON | *(required)* |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | *(required)* |
| `TTS_OUTPUT_DIR` | Directory for synthesized audio | `./output` |
| `TTS_DEFAULT_LANGUAGE` | Default BCP-47 language code | `en-US` |
| `TTS_DEFAULT_VOICE` | Default voice name (empty = auto) | |
| `TTS_DEFAULT_FORMAT` | Default audio format | `MP3` |
| `TTS_SPEAKING_RATE` | Speaking rate (0.25–4.0) | `1.0` |
| `TTS_PITCH` | Pitch (-20.0–20.0) | `0.0` |
| `TTS_CONCURRENCY` | Batch parallel limit (1–20) | `3` |

## Usage

### Interactive mode (default)

```bash
pnpm cli:dev
# or after build:
pnpm cli:prod
```

### Non-interactive subcommands

```bash
# Synthesize text
node dist/main.js synthesize --text "Hello, world!" --format MP3 --output hello

# Synthesize from file
node dist/main.js synthesize --file ./input.txt --voice en-US-Neural2-F

# Batch synthesize a directory of .txt files
node dist/main.js batch --dir ./texts --concurrency 5

# List voices
node dist/main.js voices --language en-US

# List output files
node dist/main.js files

# Delete an output file
node dist/main.js files --delete hello.mp3
```

### Supported audio formats

| Format | Encoding | Extension |
|--------|----------|-----------|
| MP3 | MP3 | `.mp3` |
| WAV | LINEAR16 | `.wav` |
| OGG | OGG_OPUS | `.ogg` |
| M4A | M4A | `.m4a` |

## Docker

```bash
docker build -t ttsg .
docker run -it --rm \
  -v $(pwd)/credentials:/app/credentials:ro \
  -v $(pwd)/output:/app/output \
  -e GOOGLE_CLOUD_PROJECT=your-project-id \
  ttsg synthesize --text "Hello from Docker"
```

Or with docker-compose:

```bash
docker compose run --rm ttsg voices --language en-US
```

## Development

```bash
pnpm cli:dev      # watch mode
pnpm test         # unit tests
pnpm lint         # ESLint
pnpm build        # compile to dist/
```

## Project structure

```
src/
  config/           # Typed configuration and Joi validation
  common/           # Shared types and constants
  tts/              # Google TTS client and synthesis service
  storage/          # Output file I/O
  settings/         # Persisted user preferences
  cli/
    commands/       # nest-commander subcommands
    menus/          # Interactive TUI handlers
```

## License

[LICENSE](LICENSE)

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/Cstrp">@Cstrp</a></strong>
</p>

---