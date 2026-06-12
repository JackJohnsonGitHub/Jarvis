# @yeliu84/pi-model-router

**Link:** [https://pi.dev/packages/@yeliu84/pi-model-router](https://pi.dev/packages/@yeliu84/pi-model-router)

## Description
An intelligent per-turn model router. It analyzes the complexity of the current request and automatically routes it to the most appropriate LLM (e.g., routing a simple greeting to a "Flash" model and a complex architectural refactor to a "Pro" model) to optimize for both cost and performance.

## Commands
- (Configuration-driven via `model-router.json`)

## Usage Examples
- **Automatic Optimization**: The router silently switches models based on the prompt; no direct command is needed by the user.
