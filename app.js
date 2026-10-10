// Configuración de ElevenLabs
const API_KEY = "sk_6a920ccf1090c9f8e825f6987a9b7c38fe0d2253cf0b1b66";
const VOICE_ID = "jtfxplhZxnBzQICVwoQn"; // Sustituye por tu Voice ID real de David Martin

// Configuración del Reconocimiento de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Tu navegador no soporta el reconocimiento de voz. Usa Google Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    // Elementos del DOM para la interfaz
    const statusText = document.querySelector('.status-text') || document.body;

    // Eventos de control del micrófono
    recognition.onstart = () => {
        console.log("🟢 Micrófono activo y escuchando...");
        if (statusText) statusText.textContent = "Escuchando...";
    };

    recognition.onerror = (event) => {
        console.error("🔴 Error en el micrófono:", event.error);
        if (statusText) statusText.textContent = "Error: " + event.error;
    };

    recognition.onend = () => {
        console.log("🟡 Reconocimiento pausado. Reiniciando...");
        try {
            recognition.start();
        } catch (e) {
            console.log("Ya estaba iniciado.");
        }
    };

    // Procesar lo que escuchas
    recognition.onresult = async (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        
        console.log("🎤 Texto captado:", transcript);

        // Detectar palabra clave "Jarvis"
        if (transcript.includes("jarvis")) {
            console.log("⚡ Palabra clave 'Jarvis' detectada.");
            if (statusText) statusText.textContent = "Procesando comando...";
            
            // Responder con ElevenLabs
            await hablarJarvis("Sistema activo. ¿En qué puedo ayudarte?");
        }
    };

    // Función para llamar a la API de ElevenLabs
    async function hablarJarvis(texto) {
        console.log("🔊 Enviando petición a ElevenLabs...");
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": API_KEY
                },
                body: JSON.stringify({
                    text: texto,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("🔴 Error API ElevenLabs:", errorData);
                return;
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            console.log("▶️ Reproduciendo voz de Jarvis...");
            await audio.play();
            if (statusText) statusText.textContent = "Escuchando...";
        } catch (error) {
            console.error("🔴 Error al conectar con ElevenLabs:", error);
        }
    }

    // Iniciar escucha al hacer clic en la pantalla
    document.addEventListener("click", () => {
        try {
            recognition.start();
            console.log("▶️ Reconocimiento iniciado por interacción del usuario.");
        } catch (e) {
            console.log("El micrófono ya estaba en ejecución.");
        }
    }, { once: true });
}
