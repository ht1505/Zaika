# mic_client.py  ──  ZAIKA Microphone Bot
# Run in a SEPARATE terminal while main.py (the server) is running:
#   Terminal 1:  python main.py
#   Terminal 2:  python mic_client.py

import time
import requests
import speech_recognition as sr
import pyttsx3

# Uncomment to use Gemini STT instead of Google
# from google import genai, types
# _gemini = genai.Client(api_key="YOUR_GEMINI_API_KEY_HERE")

API_BASE    = "http://127.0.0.1:8000"
PROCESS_URL = f"{API_BASE}/api/voice/process"
MIC_SESSION = "mic_session"


def speak(text: str):
    print(f"\n🤖 Bot: {text}")
    try:
        tts = pyttsx3.init()
        tts.setProperty("rate", 155)
        tts.setProperty("volume", 1.0)
        tts.say(text)
        tts.runAndWait()
        tts.stop()
    except Exception as e:
        print(f"[TTS error] {e}")


recognizer = sr.Recognizer()
recognizer.energy_threshold = 300
recognizer.dynamic_energy_threshold = True


def record_and_transcribe(timeout: int = 6) -> str:
    with sr.Microphone() as source:
        print("\n🎙️  Listening...")
        recognizer.adjust_for_ambient_noise(source, duration=0.8)
        try:
            audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=12)
        except sr.WaitTimeoutError:
            return ""
    for lang in ["en-IN", "hi-IN", "gu-IN"]:
        try:
            text = recognizer.recognize_google(audio, language=lang)
            if text:
                print(f"  [{lang}] You said: {text}")
                return text.strip()
        except sr.UnknownValueError:
            continue
        except Exception as e:
            print(f"  [{lang}] error: {e}")
    return ""

    # Gemini STT option (uncomment to enable):
    # import os
    # try:
    #     with open("temp_input.wav", "wb") as f: f.write(audio.get_wav_data())
    #     with open("temp_input.wav", "rb") as f: audio_data = f.read()
    #     response = _gemini.models.generate_content(
    #         model="gemini-2.5-flash",
    #         contents=["Transcribe this restaurant order in English, Hindi, or Gujarati. "
    #                   "Return ONLY the transcribed text.",
    #                   types.Part.from_bytes(data=audio_data, mime_type="audio/wav")])
    #     os.remove("temp_input.wav")
    #     return response.text.strip()
    # except Exception as e:
    #     print(f"Gemini STT error: {e}"); return ""


def send(transcript: str) -> dict:
    try:
        r = requests.post(PROCESS_URL,
                          json={"session_id": MIC_SESSION, "transcript": transcript},
                          timeout=5)
        return r.json() if r.status_code == 200 else {}
    except requests.RequestException as e:
        print(f"[Network error] {e}")
        return {}


def _handle_disambiguate(options: list, category: str):
    """
    Server returned state=disambiguate (user said a category like 'pizza').
    Bot already spoke the full numbered list.
    Now listen for their pick — by number or item name — up to 3 tries.
    """
    for attempt in range(3):
        text = record_and_transcribe(timeout=8)

        if not text:
            if attempt < 2:
                speak("Sorry, I didn't hear that. Say the item name or its number.")
            continue

        print(f"👤 You said: {text}")

        # Server is still in disambiguate state — it will match number or name
        data = send(text)
        if not data:
            speak("Sorry, something went wrong.")
            return

        speak(data.get("reply", "Ok."))

        # If state changed away from disambiguate, we're done
        if data.get("state") != "disambiguate":
            return
        # Otherwise loop — server re-prompted with the list again


def main():
    try:
        info = requests.get(f"{API_BASE}/health", timeout=3).json()
        print(f"✅ Connected — {info.get('menu_items')} items, "
              f"{info.get('associations')} associations loaded")
    except Exception:
        print("❌ Server not running! Start it first:  python main.py")
        return

    speak("Welcome! What would you like to order today?")

    consecutive_silence = 0
    MAX_SILENCE = 4

    while True:
        try:
            text = record_and_transcribe()

            if not text:
                consecutive_silence += 1
                if consecutive_silence >= MAX_SILENCE:
                    speak("I'm having trouble hearing you. Please check your microphone.")
                    consecutive_silence = 0
                else:
                    speak("Sorry, I didn't catch that. Could you please repeat?")
                continue

            consecutive_silence = 0
            print(f"👤 You said: {text}")

            data = send(text)
            if not data:
                speak("Sorry, something went wrong. Please try again.")
                continue

            reply    = data.get("reply", "Ok.")
            state    = data.get("state", "ordering")
            options  = data.get("menu_options", [])
            category = data.get("menu_category", "")

            speak(reply)

            # Category browse — bot read the list, now listen for selection
            if state == "disambiguate" and options:
                _handle_disambiguate(options, category)
                continue

            # Order complete
            if state == "done":
                break

            time.sleep(0.3)

        except KeyboardInterrupt:
            print("\nStopped.")
            speak("Goodbye!")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            speak("Sorry, something went wrong. Let's try again.")


if __name__ == "__main__":
    main()