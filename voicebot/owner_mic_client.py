# owner_mic_client.py — ZAIKA Owner Voice Bot
# Run in a SEPARATE terminal while owner_analytics.py is running:
#   Terminal 1:  python owner_analytics.py
#   Terminal 2:  python owner_mic_client.py

import time
import requests
import speech_recognition as sr
import pyttsx3

API_BASE = "http://127.0.0.1:8001"
CHAT_URL  = f"{API_BASE}/api/owner/chat"
SESSION   = "owner_mic_session"

OPENING = (
    "Welcome, Boss! I'm your ZAIKA business advisor. "
    "Ask me anything — revenue, menu changes, combo deals, or which items to promote."
)

COMMANDS_EXIT = {"exit", "quit", "bye", "goodbye", "stop", "band karo", "ruk ja"}


def speak(text: str):
    print(f"\n🤖 Advisor: {text}")
    try:
        tts = pyttsx3.init()
        tts.setProperty("rate", 150)
        tts.setProperty("volume", 1.0)
        tts.say(text)
        tts.runAndWait()
        tts.stop()
    except Exception as e:
        print(f"[TTS error] {e}")


recognizer = sr.Recognizer()
recognizer.energy_threshold = 300
recognizer.dynamic_energy_threshold = True


def record_and_transcribe(timeout: int = 8) -> str:
    with sr.Microphone() as source:
        print("\n🎙️  Listening...")
        recognizer.adjust_for_ambient_noise(source, duration=0.8)
        try:
            audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=20)
        except sr.WaitTimeoutError:
            return ""
    for lang in ["en-IN", "hi-IN"]:
        try:
            text = recognizer.recognize_google(audio, language=lang)
            if text:
                print(f"  [{lang}] You: {text}")
                return text.strip()
        except sr.UnknownValueError:
            continue
        except Exception as e:
            print(f"  [{lang}] error: {e}")
    return ""


def send(message: str) -> str:
    try:
        r = requests.post(
            CHAT_URL,
            json={"session_id": SESSION, "message": message},
            timeout=30,
        )
        if r.status_code == 200:
            return r.json().get("reply", "Sorry, no response.")
        return "Server error."
    except requests.RequestException as e:
        print(f"[Network error] {e}")
        return "Sorry, connection issue."


def strip_for_speech(text: str) -> str:
    """Remove markdown-ish formatting that doesn't sound good in TTS."""
    import re
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)   # **bold**
    text = re.sub(r"\*(.+?)\*",   r"\1", text)   # *italic*
    text = re.sub(r"#+\s",         "",   text)   # ## headers
    text = re.sub(r"₹",            "rupees ", text)
    return text.strip()


def main():
    try:
        info = requests.get(f"{API_BASE}/health", timeout=3).json()
        print(f"✅ Connected — {info.get('total_orders')} orders loaded")
    except Exception:
        print("❌ Server not running! Start it first:  python owner_analytics.py")
        return

    speak(OPENING)

    consecutive_silence = 0
    MAX_SILENCE = 3

    while True:
        try:
            text = record_and_transcribe()

            if not text:
                consecutive_silence += 1
                if consecutive_silence >= MAX_SILENCE:
                    speak("I'm here whenever you have a question, Boss.")
                    consecutive_silence = 0
                else:
                    speak("Sorry, didn't catch that. Please repeat.")
                continue

            consecutive_silence = 0

            if text.lower().strip() in COMMANDS_EXIT:
                speak("Goodbye Boss! See you soon.")
                break

            print(f"👤 Owner: {text}")
            reply = send(text)
            clean = strip_for_speech(reply)

            # TTS has a practical limit — split long replies
            if len(clean) > 600:
                parts = [clean[i:i+600] for i in range(0, len(clean), 600)]
                for part in parts:
                    speak(part)
                    time.sleep(0.3)
            else:
                speak(clean)

            time.sleep(0.4)

        except KeyboardInterrupt:
            print("\nStopped.")
            speak("Goodbye Boss!")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            speak("Something went wrong. Let's try again.")


if __name__ == "__main__":
    main()