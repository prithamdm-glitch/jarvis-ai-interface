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

    // Cargar voces del navegador
    let voces = [];
    function actualizarVoces() {
        voces = window.speechSynthesis.getVoices();
    }
    actualizarVoces();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = actualizarVoces;
    }

    recognition.onstart = () => {
        console.log("🟢 Jarvis escuchando libremente...");
        if (statusText) statusText.textContent = "Escuchando... Habla cuando quieras.";
    };

    recognition.onerror = (event) => {
        console.error("Error en reconocimiento:", event.error);
    };

    // Mantener la escucha activa de forma permanente
    recognition.onend = () => {
        if (!isSpeaking) {
            try { recognition.start(); } catch (e) {}
        }
    };

    // Procesar directamente cualquier cosa que digas
    recognition.onresult = async (event) => {
        if (isSpeaking) return;

        const lastResultIndex = event.results.length - 1;
        const texto = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        console.log("🎤 Has dicho:", texto);

        if (texto.length > 2) {
            // Pausamos temporalmente el reconocimiento mientras procesa y habla para evitar ecos
            try { recognition.stop(); } catch(e) {}
            isSpeaking = true;
            if (statusText) statusText.textContent = "Pensando...";

            // Consultar a la IA y ejecutar acciones directas
            const respuestaIA = await procesarAccionYRespuestaReal(texto);
            
            await hablarJarvis(respuestaIA);

            isSpeaking = false;
            if (statusText) statusText.textContent = "Escuchando... Habla cuando quieras.";
            try { recognition.start(); } catch (e) {}
        }
    };

    // Cerebro inteligente directo (IA + Acciones web naturales)
    async function procesarAccionYRespuestaReal(pregunta) {
        // Acciones automáticas directas
        if (pregunta.includes("youtube") || pregunta.includes("abre youtube")) {
            window.open("https://www.youtube.com", "_blank");
            return "Abriendo YouTube ahora mismo.";
        }
        if (pregunta.includes("google") || pregunta.includes("abre google")) {
            window.open("https://www.google.com", "_blank");
            return "Abriendo Google.";
        }

        try {
            const systemPrompt = "Eres Jarvis, una inteligencia artificial avanzada, conversacional y muy natural. Responde de forma directa, humana y breve (máximo 2 frases) en español.";
            const url = `https://text.pollinations.ai/${encodeURIComponent(pregunta)}?system=${encodeURIComponent(systemPrompt)}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error en IA");
            
            const respuestaTexto = await res.text();
            return respuestaTexto.trim();
        } catch (error) {
            console.error("Error en la IA:", error);
            return "He procesado tu solicitud, aunque ha habido un pequeño fallo de red al consultar los servidores.";
        }
    }

    // Voz fluida y natural
    function hablarJarvis(texto) {
        return new Promise((resolve) => {
            console.log("🔊 Jarvis respondiendo:", texto);
            if (statusText) statusText.textContent = "Jarvis hablando...";

            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();

            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 1.05;
            utterance.pitch = 0.95;

            if (voces.length === 0) {
                voces = window.speechSynthesis.getVoices();
            }

            const vozElegida = voces.find(v => 
                (v.lang.includes('es') || v.lang.includes('ES')) && 
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Helena') || v.name.includes('Lucia'))
            ) || voces.find(v => v.lang.includes('es'));

            if (vozElegida) {
                utterance.voice = vozElegida;
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
            console.log("▶️ Conversación libre iniciada.");
        } catch (e) {}
    }, { once: true });
}
