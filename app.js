// Configuración del Reconocimiento de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Tu navegador no soporta el reconocimiento de voz. Usa Google Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false; // Procesa frase por frase sin solaparse
    recognition.interimResults = false;

    const statusText = document.querySelector('.status-text') || document.body;
    let isSpeaking = false;

    // Cargar voces del navegador
    let vocesDisponibles = [];
    function cargarVoces() {
        vocesDisponibles = window.speechSynthesis.getVoices();
    }
    cargarVoces();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = cargarVoces;
    }

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
            try {
                recognition.start();
            } catch (e) {}
        }
    };

    recognition.onresult = async (event) => {
        if (isSpeaking) return;

        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("🎤 Texto captado:", transcript);

        if (transcript.length > 0) {
            // Detener micrófono temporalmente para evitar ruidos mientras procesa
            try { recognition.stop(); } catch(e) {}

            if (statusText) statusText.textContent = "Pensando...";

            // Obtener respuesta inteligente
            const respuestaIA = await obtenerRespuestaIA(transcript);
            hablarJarvis(respuestaIA);
        }
    };

    // Consulta a la IA gratuita para responder a cualquier pregunta
    async function obtenerRespuestaIA(pregunta) {
        console.log("🤖 Procesando pregunta con IA:", pregunta);
        try {
            const promptSystem = "Eres Jarvis, un asistente virtual muy breve, claro y conciso. Responde en español en un máximo de 2 frases corta.";
            const url = `https://text.pollinations.ai/${encodeURIComponent(pregunta)}?system=${encodeURIComponent(promptSystem)}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error en respuesta IA");
            
            const texto = await res.text();
            return texto.trim();
        } catch (error) {
            console.error("🔴 Error al obtener respuesta:", error);
            return "No he podido procesar esa pregunta en este momento.";
        }
    }

    // Función de voz corregida para forzar la emisión de sonido
    function hablarJarvis(texto) {
        isSpeaking = true;
        console.log("🔊 Generando respuesta de voz:", texto);

        // Solución al bug de Chrome: cancelar y reanudar el motor de voz
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Asignar voz en español si está disponible
        if (vocesDisponibles.length === 0) {
            vocesDisponibles = window.speechSynthesis.getVoices();
        }

        const vozEspanol = vocesDisponibles.find(v => 
            (v.lang.includes('es') || v.lang.includes('ES')) && 
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Jorge') || v.name.includes('Helena'))
        ) || vocesDisponibles.find(v => v.lang.includes('es'));

        if (vozEspanol) {
            utterance.voice = vozEspanol;
            console.log("🎙️ Voz seleccionada:", vozEspanol.name);
        }

        utterance.onstart = () => {
            console.log("▶️ Jarvis hablando...");
            if (statusText) statusText.textContent = "Hablando...";
        };

        const reanudarEscucha = () => {
            isSpeaking = false;
            console.log("✅ Terminado de hablar. Reactivando micrófono...");
            if (statusText) statusText.textContent = "Escuchando...";
            try {
                recognition.start();
            } catch (e) {}
        };

        utterance.onend = reanudarEscucha;
        utterance.onerror = (e) => {
            console.error("🔴 Error en reproducción de voz:", e);
            reanudarEscucha();
        };

        // Forzar habla
        window.speechSynthesis.speak(utterance);
    }

    // Iniciar con el primer clic del usuario
    document.addEventListener("click", () => {
        // Desbloquear el motor de audio del navegador
        window.speechSynthesis.resume();
        
        try {
            recognition.start();
            console.log("▶️ Reconocimiento iniciado por interacción del usuario.");
        } catch (e) {}
    }, { once: true });
}
