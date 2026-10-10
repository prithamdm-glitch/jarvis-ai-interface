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

    // Procesar cualquier texto captado por el micrófono
    recognition.onresult = async (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        
        console.log("🎤 Texto captado:", transcript);

        // Se activa directamente al captar cualquier voz
        if (transcript.length > 0) {
            console.log("⚡ Comando de voz procesado:", transcript);
            if (statusText) statusText.textContent = "Procesando comando...";
            
            // Responder con la voz del navegador
            hablarJarvis("Hola, soy Jarvis. Tu asistente de inteligencia artificial. ¿En qué puedo ayudarte hoy?");
        }
    };

    // Función usando la sintesis de voz nativa del navegador
    function hablarJarvis(texto) {
        console.log("🔊 Generando respuesta con voz local...");
        
        // Detener reproducciones anteriores para evitar solapamientos
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0; // Velocidad normal
        utterance.pitch = 1.0; // Tono de voz normal

        utterance.onstart = () => {
            console.log("▶️ Reproduciendo voz de Jarvis...");
            if (statusText) statusText.textContent = "Hablando...";
        };

        utterance.onend = () => {
            console.log("✅ Reproducción finalizada. Escuchando de nuevo...");
            if (statusText) statusText.textContent = "Escuchando...";
        };

        utterance.onerror = (e) => {
            console.error("🔴 Error en la voz del navegador:", e);
            if (statusText) statusText.textContent = "Escuchando...";
        };

        window.speechSynthesis.speak(utterance);
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
