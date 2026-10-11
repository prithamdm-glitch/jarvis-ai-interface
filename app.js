const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Usa Google Chrome para compatibilidad de voz.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true; 
    recognition.interimResults = false;

    const statusText = document.getElementById('status-text');
    const coreBall = document.getElementById('jarvis-core');
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
        console.log("🟢 Jarvis escuchando libremente...");
        if (statusText && !isSpeaking) statusText.textContent = "ESCUCHANDO...";
    };

    recognition.onerror = (event) => {
        console.error("Error en reconocimiento:", event.error);
    };

    recognition.onend = () => {
        if (!isSpeaking) {
            try { recognition.start(); } catch (e) {}
        }
    };

    // Escucha continua sin palabras clave obligatorias ("Oye socio")
    recognition.onresult = async (event) => {
        if (isSpeaking) return;

        const lastResultIndex = event.results.length - 1;
        const texto = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        console.log("🎤 Has dicho:", texto);

        if (texto.length > 2) {
            try { recognition.stop(); } catch(e) {}
            isSpeaking = true;
            if (statusText) statusText.textContent = "PROCESANDO...";

            // 1. Ejecutar acciones directas del sistema/web
            const accionEjecutada = ejecutarAccionLocal(texto);

            if (accionEjecutada) {
                await hablarJarvis(accionEjecutada);
            } else {
                // 2. Si no es una acción directa, consulta a la IA para una respuesta fluida
                const respuestaIA = await consultarInteligenciaArtificial(texto);
                await hablarJarvis(respuestaIA);
            }

            isSpeaking = false;
            if (statusText) statusText.textContent = "ESCUCHANDO...";
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
            window.open("https://www.google.com/search?q=calculadora", "_blank");
            return "Abriendo la calculadora.";
        }
        if (comando.includes("clima") || comando.includes("tiempo") || comando.includes("temperatura")) {
            window.open("https://www.google.com/search?q=tiempo+actual", "_blank");
            return "Buscando la previsión del tiempo actual para ti.";
        }
        return null; 
    }

    // Cerebro de IA conversacional avanzado
    async function consultarInteligenciaArtificial(pregunta) {
        try {
            const systemPrompt = "Eres Jarvis, una inteligencia artificial avanzada, conversacional, humana y muy directa. Responde en un máximo de 2 frases en español.";
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

    // Motor de voz con animación interactiva en la bola central
    function hablarJarvis(texto) {
        return new Promise((resolve) => {
            console.log("🔊 Jarvis respondiendo:", texto);
            if (statusText) statusText.textContent = "HABLANDO...";

            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();

            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 1.05;
            utterance.pitch = 0.90;

            if (voces.length === 0) {
                voces = window.speechSynthesis.getVoices();
            }

            const vozElegida = voces.find(v => 
                (v.lang.includes('es') || v.lang.includes('ES')) && 
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft Helena') || v.name.includes('Lucia'))
            ) || voces.find(v => v.lang.includes('es'));

            if (vozElegida) {
                utterance.voice = vozElegida;
            }

            // Bucle de animación para que la bola vibre y se mueva mientras Jarvis habla
            const animarIntervalo = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(animarIntervalo);
                    coreBall.style.transform = "scale(1)";
                    return;
                }
                // Escala aleatoria para simular el pulso de voz
                let scaleRandom = 1 + (Math.random() * 0.25);
                coreBall.style.transform = `scale(${scaleRandom})`;
            }, 80);

            utterance.onend = () => {
                clearInterval(animarIntervalo);
                coreBall.style.transform = "scale(1)";
                resolve();
            };

            utterance.onerror = () => {
                clearInterval(animarIntervalo);
                coreBall.style.transform = "scale(1)";
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
            if (statusText) statusText.textContent = "ESCUCHANDO...";
        } catch (e) {}
    }, { once: true });
}
