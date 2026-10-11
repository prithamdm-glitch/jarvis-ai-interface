const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Usa Google Chrome para compatibilidad.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true; 
    recognition.interimResults = false;

    const statusText = document.querySelector('.status-text') || document.body;
    let isSpeaking = false;

    let voces = [];
    function actualizarVoces() {
        voces = window.speechSynthesis.getVoices();
    }
    actualizarVoces();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = actualizarVoces;
    }

    recognition.onstart = () => {
        console.log("🟢 Jarvis en modo conversación libre...");
        if (statusText) statusText.textContent = "Escuchando en tiempo real...";
    };

    recognition.onerror = (event) => {
        console.error("Error en reconocimiento:", event.error);
    };

    recognition.onend = () => {
        if (!isSpeaking) {
            try { recognition.start(); } catch (e) {}
        }
    };

    // Escucha continua sin palabras clave obligatorias ("oye socio")
    recognition.onresult = async (event) => {
        if (isSpeaking) return;

        const lastResultIndex = event.results.length - 1;
        const texto = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        console.log("🎤 Has dicho:", texto);

        if (texto.length > 2) {
            try { recognition.stop(); } catch(e) {}
            isSpeaking = true;
            if (statusText) statusText.textContent = "Procesando...";

            // 1. Ejecutar acciones directas del sistema/web antes de hablar
            const accionEjecutada = ejecutarAccionLocal(texto);

            if (accionEjecutada) {
                await hablarJarvis(accionEjecutada);
            } else {
                // 2. Si no es una acción directa, consulta a la IA para una respuesta fluida
                const respuestaIA = await consultarInteligenciaArtificial(texto);
                await hablarJarvis(respuestaIA);
            }

            isSpeaking = false;
            if (statusText) statusText.textContent = "Escuchando en tiempo real...";
            try { recognition.start(); } catch (e) {}
        }
    };

    // Sistema de acciones reales (Abre pestañas, apps, calculadora web, etc.)
    function ejecutarAccionLocal(comando) {
        if (comando.includes("abre youtube") || comando.includes("abrir youtube")) {
            window.open("https://www.youtube.com", "_blank");
            return "Abriendo YouTube en una nueva pestaña.";
        }
        if (comando.includes("abre google") || comando.includes("abrir google")) {
            window.open("https://www.google.com", "_blank");
            return "Abriendo Google.";
        }
        if (comando.includes("calculadora") || comando.includes("calcular")) {
            // Abrir una calculadora web integrada o herramienta útil
            window.open("https://www.google.com/search?q=calculadora", "_blank");
            return "Abriendo la calculadora.";
        }
        if (comando.includes("clima") || comando.includes("tiempo") || comando.includes("temperatura")) {
            window.open("https://www.google.com/search?q=tiempo+actual", "_blank");
            return "Buscando la previsión del tiempo actual para ti.";
        }
        return null; // Si no hay acción física, pasa a la IA conversacional
    }

    // Cerebro de IA conversacional avanzado
    async function consultarInteligenciaArtificial(pregunta) {
        try {
            const systemPrompt = "Eres Jarvis, una inteligencia artificial avanzada, sarcástica pero muy útil, conversacional y humana. Responde de forma breve y directa (máximo 2 frases) en español.";
            const url = `https://text.pollinations.ai/${encodeURIComponent(pregunta)}?system=${encodeURIComponent(systemPrompt)}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error en IA");
            
            const respuestaTexto = await res.text();
            return respuestaTexto.trim();
        } catch (error) {
            console.error("Error en la IA:", error);
            return "He tenido un pequeño fallo de conexión neuronal, prueba otra vez.";
        }
    }

    // Motor de voz optimizado a máxima calidad disponible
    function hablarJarvis(texto) {
        return new Promise((resolve) => {
            console.log("🔊 Jarvis respondiendo:", texto);
            if (statusText) statusText.textContent = "Jarvis hablando...";

            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();

            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 1.05; // Ritmo fluido
            utterance.pitch = 0.90; // Tono grave y serio

            if (voces.length === 0) {
                voces = window.speechSynthesis.getVoices();
            }

            // Seleccionar la voz más natural posible del sistema
            const vozElegida = voces.find(v => 
                (v.lang.includes('es') || v.lang.includes('ES')) && 
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft Helena') || v.name.includes('Lucia'))
            ) || voces.find(v => v.lang.includes('es'));

            if (vozElegida) {
                utterance.voice = vozElegida;
                console.log("🎙️ Voz activa:", vozElegida.name);
            }

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = () => {
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    }

    // Activar audio y escucha con un solo clic inicial
    document.addEventListener("click", () => {
        window.speechSynthesis.resume();
        try {
            recognition.start();
            console.log("▶️ Jarvis activo en conversación libre.");
        } catch (e) {}
    }, { once: true });
}
