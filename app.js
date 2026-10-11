// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = "sk_6a920ccf1090c9f8e825f6987a9b7c38fe0d2253cf0b1b66";
const VOICE_ID = "jtfxplhZxnBzQICVwoQn"; // Tu Voice ID personalizado

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
        console.log("🟢 Micrófono escuchando...");
        if (statusText) statusText.textContent = "Di 'oye socio' para activar a Jarvis...";
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

        // Activación por voz: "oye socio"
        if (estado === "esperando_activacion") {
            if (texto.includes("oye socio") || texto.includes("oye solio") || texto.includes("oído socio")) {
                console.log("⚡ ¡Frase de activación detectada!");
                estado = "hablando";
                
                try { recognition.stop(); } catch(e) {}
                if (statusText) statusText.textContent = "¡Activado!";

                await hablarJarvis("Dime, ¿qué necesitas?");
                
                estado = "escuchando_orden";
                if (statusText) statusText.textContent = "Te escucho... Haz tu pregunta o acción";
                
                try { recognition.start(); } catch (e) {}
            }
        } 
        // Procesar orden tras la activación
        else if (estado === "escuchando_orden") {
            try { recognition.stop(); } catch(e) {}
            estado = "hablando";
            if (statusText) statusText.textContent = "Procesando...";

            console.log("⚡ Ejecutando orden:", texto);
            const respuesta = procesarAccionYRespuesta(texto);
            
            await hablarJarvis(respuesta);

            estado = "esperando_activacion";
            if (statusText) statusText.textContent = "Di 'oye socio' para activar a Jarvis...";
            
            try { recognition.start(); } catch (e) {}
        }
    };

    function procesarAccionYRespuesta(texto) {
        if (texto.includes("youtube") || texto.includes("abre youtube")) {
            window.open("https://www.youtube.com", "_blank");
            return "Abriendo YouTube en una nueva pestaña.";
        } 
        else if (texto.includes("google") || texto.includes("abre google")) {
            window.open("https://www.google.com", "_blank");
            return "Abriendo Google.";
        }
        else if (texto.includes("lionel messi") || texto.includes("messi")) {
            return "Lionel Messi es un futbolista argentino considerado uno de los mejores de la historia y campeón del mundo.";
        } 
        else if (texto.includes("albert einstein")) {
            return "Albert Einstein fue el físico teórico creador de la teoría de la relatividad.";
        } 
        else if (texto.includes("tiempo") || texto.includes("clima") || texto.includes("previsión")) {
            return "Para los próximos días se esperan cielos despejados y temperaturas agradables.";
        } 
        else if (texto.includes("qué puedes hacer") || texto.includes("ayuda")) {
            return "Puedo abrir páginas web como YouTube, buscar biografías, darte la hora y responder a cualquier duda.";
        } 
        else if (texto.includes("preséntate") || texto.includes("quién eres")) {
            return "Hola, soy Jarvis, tu asistente virtual inteligente integrado en la web.";
        } 
        else if (texto.includes("hora")) {
            const d = new Date();
            return `Son las ${d.getHours()} horas y ${d.getMinutes()} minutos.`;
        } 
        else if (texto.includes("chiste")) {
            return "Va un caracol y se sube a un tren, y dice: ¡Uff, qué velocidad!";
        }
        else {
            return `Has consultado sobre ${texto}. He procesado la información correctamente.`;
        }
    }

    async function hablarJarvis(texto) {
        console.log("🔊 Generando voz para:", texto);
        if (statusText) statusText.textContent = "Jarvis hablando...";

        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY
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

            if (!response.ok) throw new Error(`Error en ElevenLabs: ${response.status}`);

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            await new Promise((resolve) => {
                audio.onended = resolve;
                audio.onerror = resolve;
                audio.play().catch(resolve);
            });

        } catch (error) {
            console.warn("⚠️ Usando respaldo de voz local HD:", error);
            await hablarVozLocal(texto);
        }
    }

    function hablarVozLocal(texto) {
        return new Promise((resolve) => {
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();

            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            utterance.rate = 1.0;
            utterance.pitch = 0.95;

            const voces = window.speechSynthesis.getVoices();
            const vozHD = voces.find(v => 
                v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Helena'))
            ) || voces.find(v => v.lang.includes('es'));

            if (vozHD) utterance.voice = vozHD;

            utterance.onend = resolve;
            utterance.onerror = resolve;

            window.speechSynthesis.speak(utterance);
        });
    }

    document.addEventListener("click", () => {
        window.speechSynthesis.resume();
        try {
            recognition.start();
            console.log("▶️ Escucha continua iniciada.");
        } catch (e) {}
    }, { once: true });
}
