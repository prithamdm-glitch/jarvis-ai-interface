// Configuración del Reconocimiento de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Tu navegador no soporta el reconocimiento de voz. Usa Google Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false; // Procesa frase a frase de forma limpia
    recognition.interimResults = false;

    const statusText = document.querySelector('.status-text') || document.body;
    let isSpeaking = false;

    // Cargar voces del navegador para elegir la más natural
    let vocesDisponibles = [];
    function cargarVoces() {
        vocesDisponibles = window.speechSynthesis.getVoices();
    }
    cargarVoces();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = cargarVoces;
    }

    recognition.onstart = () => {
        console.log("🟢 Micrófono escuchando...");
        if (statusText) statusText.textContent = "Escuchando...";
    };

    recognition.onerror = (event) => {
        console.error("🔴 Error micrófono:", event.error);
        if (statusText) statusText.textContent = "Error: " + event.error;
    };

    recognition.onend = () => {
        if (!isSpeaking) {
            try {
                recognition.start();
            } catch (e) {}
        }
    };

    recognition.onresult = async (event) => {
        if (isSpeaking) return;

        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("🎤 Captado:", transcript);

        if (transcript.length > 0) {
            try { recognition.stop(); } catch(e) {}

            if (statusText) statusText.textContent = "Pensando...";
            
            // Consultar a la IA para obtener una respuesta real
            const respuestaIA = await obtenerRespuestaIA(transcript);
            hablarJarvis(respuestaIA);
        }
    };

    // Función para consultar a una IA libre (sin API key)
    async function obtenerRespuestaIA(pregunta) {
        console.log("🤖 Consultando IA para:", pregunta);
        try {
            const promptSystem = "Eres Jarvis, una IA de asistencia personal breve, concisa y directa. Responde en español en 1 o 2 frases máximo.";
            const url = `https://text.pollinations.ai/${encodeURIComponent(pregunta)}?system=${encodeURIComponent(promptSystem)}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error en la respuesta de la IA");
            
            const textoRespuesta = await res.text();
            return textoRespuesta.trim();
        } catch (error) {
            console.error("🔴 Error con la IA:", error);
            return "Lo siento, he tenido un problema al procesar tu respuesta.";
        }
    }

    // Función de voz optimizada con selección de voz natural
    function hablarJarvis(texto) {
        isSpeaking = true;
        console.log("🔊 Respondiendo:", texto);
        
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 0.95; // Un tono ligeramente más grave para sonar más natural

        // Seleccionar una voz en español de mejor calidad si está disponible
        if (vocesDisponibles.length > 0) {
            const vozEspanolMejor = vocesDisponibles.find(v => 
                (v.lang.includes('es') || v.lang.includes('ES')) && 
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Jorge') || v.name.includes('Helena'))
            ) || vocesDisponibles.find(v => v.lang.includes('es'));
            
            if (vozEspanolMejor) {
                utterance.voice = vozEspanolMejor;
                console.log("🎙️ Usando la voz:", vozEspanolMejor.name);
            }
        }

        utterance.onstart = () => {
            if (statusText) statusText.textContent = "Hablando...";
        };

        const reanudarEscucha = () => {
            isSpeaking = false;
            console.log("✅ Fin de respuesta. Reactivando micrófono...");
            if (statusText) statusText.textContent = "Escuchando...";
            try {
                recognition.start();
            } catch (e) {}
        };

        utterance.onend = reanudarEscucha;
        utterance.onerror = reanudarEscucha;

        window.speechSynthesis.speak(utterance);
    }

    // Iniciar al hacer clic
    document.addEventListener("click", () => {
        try {
            recognition.start();
            console.log("▶️ Iniciado por el usuario.");
        } catch (e) {}
    }, { once: true });
}
