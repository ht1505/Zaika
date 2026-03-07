"""
Run this file to start the voice bot on port 8001.
Place it in the same folder as voice_bot.py and smart_suggestions.py.

Usage:
    python run_voice_bot.py
"""
import uvicorn

if __name__ == "__main__":
    print("\n🎤  Zaika Voice Bot starting on http://localhost:8001")
    print("    Make sure menu.csv and dataset_with_confidence.csv are in this folder.\n")
    uvicorn.run("voice_bot:app", host="0.0.0.0", port=8001, reload=False)