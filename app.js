const jarvisCore = document.getElementById('jarvisCore');
const statusText = document.getElementById('statusText');

const ELEVENLABS_API_KEY = "sk_6a920ccf1090c9f8e825f6987a9b7c38fe0d2253cf0b1b66";
const VOICE_ID = "jtfxplhZxnBzQICVwoQn";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

async function speakWithElevenLabs(text) {
    statusText.innerText = "Jarvis hablando...";
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) throw new Error("Error en la API de ElevenLabs");

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
            statusText.innerText = "Esperando comando...";
        };

        audio.play();
    } catch (error) {
        console.error(error);
        statusText.innerText = "Error al reproducir audio";
    }
}

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        statusText.innerText = "Escuchando...";
        jarvisCore.style.borderColor = "rgba(0, 255, 255, 0.8)";
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            statusText.innerText = "Comando: " + finalTranscript;
            processCommand(finalTranscript.toLowerCase());
        } else {
            statusText.innerText = "Escuchando: " + interimTranscript;
        }
    };

    recognition.onerror = (event) => {
        statusText.innerText = "Error: " + event.error;
    };

    recognition.onend = () => {
        statusText.innerText = "Esperando comando...";
        jarvisCore.style.borderColor = "rgba(0, 255, 255, 0.5)";
        recognition.start();
    };

    function processCommand(command) {
        if (command.includes("jarvis")) {
            const respuesta = "Sistema activo. ¿En qué puedo ayudarte?";
            speakWithElevenLabs(respuesta);
        }
    }

    recognition.start();
    statusText.innerText = "Sistema iniciado...";
} else {
    statusText.innerText = "Tu navegador no soporta reconocimiento de voz.";
}
