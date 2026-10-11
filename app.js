// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = "sk_6a920ccf1090c9f8e825f6987a9b7c38fe0d2253cf0b1b66";
const VOICE_ID = "jtfxplhZxnBzQICVwoQn"; // Tu Voice ID personalizado

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Usa Google Chrome para compatibilidad.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    const statusText = document.querySelector('.status-text') || document.body;

    // Estados: "esperando_aplausos", "escuchando", "hablando"
    let estado = "esperando_aplausos";
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let contadorAplausos = 0;
    let tiempoUltimoAplauso = 0;

    // 1. Detector estricto de aplausos físicos mediante AudioContext
    async function iniciarDetectorDeAplausos() {
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(micStream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);

            if (statusText) statusText.textContent = "Da 2 aplausos fuertes para activar a Jarvis...";
            console.log("👏 Escuchando aplausos reales...");

            analizarAudioAplausos();
        } catch (e) {
            console.error("Error al acceder al micrófono:", e);
            if (statusText) statusText.textContent = "Haz clic en la pantalla para permitir el micro.";
        }
    }

    function analizarAudioAplausos() {
        if (estado !== "esperando_aplausos") return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        let suma = 0;
        for (let i = 0; i < dataArray.length; i++) {
            suma += dataArray[i];
        }
        let volumen = suma / dataArray.length;

        // Umbral alto para detectar un aplauso seco (ignora voz y murmullos)
        if (volumen > 58) {
            const ahora = Date.now();
            if (ahora - tiempoUltimoAplauso > 1200) {
                contadorAplausos = 0;
            }

            contadorAplausos++;
            tiempoUltimoAplauso = ahora;
            console.log(`👏 ¡Aplauso físico detectado! (${contadorAplausos}/2)`);

            if (contadorAplausos === 2) {
                contadorAplausos = 0;
                activarJarvis();
                return;
            }

            setTimeout(pausaBreveAplauso, 400);
            return;
        }

        requestAnimationFrame(analizarAudioAplausos);
    }

    function pausaBreveAplauso() {
        setTimeout(() => {
            if (estado === "esperando_aplausos") {
                analizarAudioAplausos();
            }
        }, 400);
    }

    async function activarJarvis() {
        estado = "hablando";
        if (statusText) statusText.textContent = "¡Activado por aplausos!";
        console.log("⚡ Dos aplausos confirmados. Activando voz...");

        await hablarJarvis("Sistema activado. ¿Qué necesitas?");
        
        estado = "escuchando";
        if (statusText) statusText.textContent = "Te escucho, habla ahora...";
        try {
            recognition.start();
        } catch (e) {}
    }

    // 2. Captura de comandos de voz tras los aplausos
    recognition.onresult = async (event) => {
        if (estado !== "escuchando") return;

        const texto = event.results[0][0].transcript.toLowerCase().trim();
        console.log("🎤 Comando de voz captado:", texto);

        if (texto.length > 0) {
            try { recognition.stop(); } catch(e) {}
            estado = "hablando";
            if (statusText) statusText.textContent = "Procesando...";

            const respuesta = procesarComando(texto);
            await hablarJarvis(respuesta);

            // Volver a esperar aplausos
            estado = "esperando_aplausos";
            if (statusText) statusText.textContent = "Da 2 aplausos fuertes para activar a Jarvis...";
            analizarAudioAplausos();
        }
    };

    recognition.onerror = () => {
        if (estado === "escuchando") {
            estado = "esperando_aplausos";
            if (statusText) statusText.textContent = "Da 2 aplausos fuertes para activar a Jarvis...";
            analizarAudioAplausos();
        }
    };

    recognition.onend = () => {
        if (estado === "escuchando") {
            estado = "esperando_aplausos";
            if (statusText) statusText.textContent = "Da 2 aplausos fuertes para activar a Jarvis...";
            analizarAudioAplausos();
        }
    };

    // 3. Cerebro inteligente local
    function procesarComando(texto) {
        if (texto.includes("lionel messi") || texto.includes("messi")) {
            return "Lionel Messi es un futbolista argentino considerado uno de los mejores de la historia y campeón del mundo.";
        } else if (texto.includes("youtube") || texto.includes("abre youtube")) {
            window.open("https://www.youtube.com", "_blank");
            return "Abriendo YouTube en una nueva pestaña.";
        } else if (texto.includes("tiempo") || texto.includes("clima")) {
            return "Se esperan cielos despejados y temperaturas estables para los próximos días.";
        } else if (texto.includes("albert einstein")) {
            return "Albert Einstein fue un físico alemán creador de la teoría de la relatividad.";
        } else if (texto.includes("qué puedes hacer") || texto.includes("ayuda")) {
            return "Puedo buscar biografías, abrir páginas, darte la hora y asistirte con comandos de voz.";
        } else if (texto.includes("preséntate") || texto.includes("quién eres")) {
            return "Hola, soy Jarvis, tu asistente virtual inteligente integrado en la web.";
        } else if (texto.includes("hora")) {
            const d = new Date();
            return `Son las ${d.getHours()} horas y ${d.getMinutes()} minutos.`;
        } else if (texto.includes("chiste")) {
            return "Va un caracol y se sube a un tren, y dice: ¡Uff, qué velocidad!";
        } else {
            return `He procesado tu solicitud sobre ${texto}. Todo en orden.`;
        }
    }

    // 4. Sistema de voz principal: ElevenLabs con respaldo local automático
    async function hablarJarvis(texto) {
        if (statusText) statusText.textContent = "Jarvis generando voz...";
        console.log("🔊 Intentando conectar con ElevenLabs...");

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

            if (!response.ok) {
                throw new Error(`Error ElevenLabs HTTP: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            if (statusText) statusText.textContent = "Jarvis hablando...";
            console.log("▶️ Reproduciendo voz de ElevenLabs...");

            await new Promise((resolve) => {
                audio.onended = resolve;
                audio.onerror = resolve;
                audio.play().catch(resolve);
            });

        } catch (error) {
            console.warn("⚠️ ElevenLabs no disponible o cuota superada. Usando voz HD local de respaldo:", error);
            await hablarVozLocal(texto);
        }
    }

    // Respaldo de voz local en alta definición si ElevenLabs falla
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

    // Iniciar permisos de audio con un clic en la pantalla
    document.addEventListener("click", () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (!micStream) {
            iniciarDetectorDeAplausos();
        }
    }, { once: true });
}
