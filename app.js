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

    // Control para evitar bucles de bloqueo
    let isSpeaking = false;

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
        if (!isSpeaking) {
            console.log("🟡 Reconocimiento pausado. Reiniciando...");
            try {
                recognition.start();
            } catch (e) {
                console.log("Ya estaba iniciado.");
            }
        }
    };

    // Procesar lo que captas por voz
    recognition.onresult = async (event) => {
        if (isSpeaking) return;

        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        
        console.log("🎤 Texto captado:", transcript);

        if (transcript.length > 0) {
            console.log("⚡ Procesando pregunta:", transcript);
            if (statusText) statusText.textContent = "Pensando...";
            
            // Generar respuesta inteligente basada en lo que has dicho
            const respuestaIA = generarRespuestaInteligente(transcript);
            
            // Hacer que Jarvis hable con la respuesta generada
            hablarJarvis(respuestaIA);
        }
    };

    // Función de inteligencia simulada (aquí puedes conectar tu API de Gemini en el futuro)
    function generarRespuestaInteligente(texto) {
        if (texto.includes("cómo te llamas") || texto.includes("preséntate")) {
            return "Soy Jarvis, tu sistema de asistencia inteligente integrado en la web.";
        } else if (texto.includes("capital de españa")) {
            return "La capital de España es Madrid.";
        } else if (texto.includes("hora")) {
            const ahora = new Date();
            return `Son las ${ahora.getHours()} y ${ahora.getMinutes()}.`;
        } else {
            return `Has dicho: ${texto}. Entendido, procesando tu solicitud.`;
        }
    }

    // Función de voz (puedes cambiarla por ElevenLabs o usar la nativa optimizada)
    function hablarJarvis(texto) {
        isSpeaking = true;
        console.log("🔊 Generando respuesta de voz...");
        
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            console.log("▶️ Jarvis hablando...");
            if (statusText) statusText.textContent = "Hablando...";
        };

        const liberarYReanudar = () => {
            isSpeaking = false;
            console.log("✅ Terminado de hablar. Reactivando micrófono...");
            if (statusText) statusText.textContent = "Escuchando...";
            try {
                recognition.start();
            } catch (e) {
                // Ya activo
            }
        };

        utterance.onend = liberarYReanudar;
        utterance.onerror = liberarYReanudar;

        // Seguridad por temporizador
        setTimeout(() => {
            if (isSpeaking) {
                liberarYReanudar();
            }
        }, 7000);

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
