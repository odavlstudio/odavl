# ODAVL Autopilot Recipes

This directory contains improvement recipes used by ODAVL Autopilot's O-D-A-V-L cycle.

## Recipe Format

Each recipe is a JSON file with:

- `id`: Unique recipe identifier
- `trust`: Trust score (0.1-1.0, updated after each run)
- `action`: Shell command to execute
- `description`: Human-readable description
- `category`: Recipe category (lint, type, build, etc.)

## Trust System

Recipes are automatically scored based on success/failure:

- Success: Trust score increases
- Failure: Trust score decreases
- 3+ consecutive failures: Recipe blacklisted (trust < 0.2)

## Usage

Recipes are automatically selected by ODAVL Autopilot during the Decide phase based on:

1. Current metrics from Observe phase
2. Recipe trust scores
3. Risk budget constraints

Do not edit recipes manually unless you know what you're doing.
