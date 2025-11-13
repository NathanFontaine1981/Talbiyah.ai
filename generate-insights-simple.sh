#!/bin/bash

echo "Please enter your Anthropic API key (or press Enter to skip):"
read -s ANTHROPIC_KEY

if [ -z "$ANTHROPIC_KEY" ]; then
  echo "No key provided. Please set ANTHROPIC_API_KEY environment variable."
  echo ""
  echo "Usage:"
  echo "  export ANTHROPIC_API_KEY='your-key-here'"
  echo "  bash generate-insights-simple.sh"
  exit 1
fi

echo ""
echo "Generating Talbiyah Insights for Nathan's Quran lesson..."
echo ""

ANTHROPIC_API_KEY="$ANTHROPIC_KEY" node generate-insights-direct.mjs
