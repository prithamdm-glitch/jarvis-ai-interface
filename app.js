const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Usa Google Chrome para compatibilidad.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true; 
    recognition.interimResults = false;

    const statusText = document.querySelector('.status-text') || document.body;
    let estado = "esperando_activacion";

    recognition.onstart = () => {
        console.log("🟢 Sistema activo. Esperando 'Oye socio'...");
        if (statusText) statusText.textContent = "Di 'Oye socio' para activar a Jarvis...";
    };

    recognition.onerror = (event) => {
        console.error("Error en reconocimiento:", event.error);
    };

    recognition.onend = () => {
        if (estado === "esperando_activacion") {
            try { recognition.start(); } catch (e) {}
        }
    };

    recognition.onresult = async (event) => {
        const lastResultIndex = event.results.length - 1;
        const texto = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        console.log("🎤 Captado:", texto);

        // 1. Detección de la wake-word
        if (estado === "esperando_activacion") {
            if (texto.includes("oye socio") || texto.includes("oye solio") || texto.includes("oído socio")) {
                console.log("⚡ Activado por voz.");
                estado = "hablando";
                
                try { recognition.stop(); } catch(e) {}
                if (statusText) statusText.textContent = "¡Activado!";

                await hablarJarvis("Sistema en línea. Te escucho.");
                
                estado = "escuchando_orden";
                if (statusText) statusText.textContent = "Habla, te escucho...";
                
                try { recognition.start(); } catch (e) {}
            }
        } 
        // 2. Procesamiento de la orden con IA real (sin frases estáticas)
        else if (estado === "escuchando_orden") {
            try { recognition.stop(); } catch(e) {}
            estado = "hablando";
            if (statusText) statusText.textContent = "Pensando...";

            console.log("🧠 Generando respuesta inteligente para:", texto);
            const respuestaIA = await consultarIA(texto);
            
            await hablarJarvis(respuestaIA);

            estado = "esperando_activacion";
            if (statusText) statusText.textContent = "Di 'Oye socio' para activar a Jarvis...";
            
            try { recognition.start(); } catch (e) {}
        }
    };

    // Cerebro de IA real (Pollinations AI / Modelos de lenguaje en tiempo real)
    async function consultarIA(pregunta) {
        // Ejecutar acciones directas si el usuario lo pide
        if (pregunta.includes("youtube") || preguntoAccion(pregunta, "youtube")) {
            window.open("https://www.youtube.com", "_blank");
            return "Abriendo YouTube ahora mismo.";
        }
        if (pregunta.includes("google")) {
            window.open("https://www.google.com", "_blank");
            return "Abriendo Google.";
        }

        try {
            const systemPrompt = "Eres Jarvis, una inteligencia artificial avanzada, concisa y directa. Responde de forma natural y conversacional en español en un máximo de 2 frases.";
            const url = `https://text.pollinations.ai/${encodeURIComponent(pregunta)}?system=${encodeURIComponent(systemPrompt)}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error de red en IA");
            
            const respuestaTexto = await res.text();
            return respuestaTexto.trim();
        } catch (error) {
            console.error("Error consultando la IA:", error);
            return `He procesado tu petición sobre ${pregunta}, aunque ha habido un pequeño fallo de conexión con el servidor neuronal.`;
        }
    }

    function preguntoAccion(texto, palabraClave) {
        return texto.includes(palabraClave);
    }

    // Sistema de voz neuronal de alta definición integrado
    function hablarJarvis(texto) {
        return new Promise((resolve) => {
            console.log("🔊 Reproduciendo voz HD:", texto);
            if (statusText) statusText.textContent = "Jarvis hablando...";

            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();

            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 1.05; // Velocidad ligeramente más fluida
            utterance.pitch = 0.95; // Tono más natural

            // Seleccionar la mejor voz neuronal disponible en el dispositivo
            const voces = window.speechSynthesis.getVoices();
            const vozHD = voces.find(v => 
                (v.lang.includes('es') || v.lang.includes('ES')) && 
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Helena') || v.name.includes('Lucia'))
            ) || voces.find(v => v.lang.includes('es'));

            if (vozHD) {
                utterance.voice = vozHD;
                console.log("🎙️ Usando voz:", vozHD.name);
            }

            utterance.onend = () => {
                if (statusText) statusText.textContent = "Escuchando...";
                resolve();
            };

            utterance.onerror = () => {
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    }

    // Inicio por interacción del usuario obligatoria en navegadores
    document.addEventListener("click", () => {
        window.speechSynthesis.resume();
        try {
            recognition.start();
            console.log("▶️ Motor de escucha continua iniciado.");
        } catch (e) {}
    }, { once: true });
}
