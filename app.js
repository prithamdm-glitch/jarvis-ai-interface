const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Usa Google Chrome para compatibilidad.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    const statusText = document.querySelector('.status-text') || document.body;
    
    // Estados: "esperando_aplausos", "escuchando_comando", "hablando"
    let estado = "esperando_aplausos"; 
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let contadorAplausos = 0;
    let tiempoUltimoAplauso = 0;

    // 1. Configurar detector de aplausos mediante el micrófono
    async function iniciarDetectorDeAplausos() {
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(micStream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);

            if (statusText) statusText.textContent = "Da 2 aplausos para activar a Jarvis...";
            console.log("👏 Sistema listo. Esperando 2 aplausos...");

            detectarPicosDeSonido();
        } catch (e) {
            console.error("No se pudo acceder al micrófono para los aplausos:", e);
            if (statusText) statusText.textContent = "Haz clic en la pantalla para activar.";
        }
    }

    // Analizador de volumen en tiempo real para detectar aplausos
    function detectarPicosDeSonido() {
        if (estado !== "esperando_aplausos") return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Calcular volumen medio
        let suma = 0;
        for (let i = 0; i < dataArray.length; i++) {
            suma += dataArray[i];
        }
        let volumen = suma / dataArray.length;

        // Si el volumen supera el umbral de un aplauso seco (> 45)
        if (volumen > 45) {
            const ahora = Date.now();
            // Si pasa más de 1.5 segundos desde el último, reiniciamos el contador
            if (ahora - tiempoUltimoAplauso > 1500) {
                contadorAplausos = 0;
            }

            contadorAplausos++;
            tiempoUltimoAplauso = ahora;
            console.log(`👏 ¡Aplauso detectado! (${contadorAplausos}/2)`);

            if (contadorAplausos === 2) {
                contadorAplausos = 0;
                activarJarvisPorAplausos();
                return; // Salimos del bucle temporalmente
            }

            // Pequeña pausa para no contar un mismo aplauso doblemente
            setTimeout(detenerBreve, 300);
            return;
        }

        requestAnimationFrame(detectarPicosDeSonido);
    }

    function detenerBreve() {
        setTimeout(() => {
            if (estado === "esperando_aplausos") {
                detectarPicosDeSonido();
            }
        }, 300);
    }

    // Acción cuando se detectan los 2 aplausos
    function activarJarvisPorAplausos() {
        estado = "hablando";
        if (statusText) statusText.textContent = "¡Activado!";
        console.log("⚡ ¡Dos aplausos detectados! Activando asistente...");

        // Mensaje de confirmación auditiva
        hablar("¡Sistema activado! ¿Qué necesitas?", () => {
            estado = "escuchando_comando";
            if (statusText) statusText.textContent = "Te escucho... Habla ahora";
            try {
                recognition.start();
            } catch (e) {}
        });
    }

    // 2. Reconocimiento de voz tras la activación
    recognition.onresult = (event) => {
        if (estado !== "escuchando_comando") return;

        const texto = event.results[0][0].transcript.toLowerCase().trim();
        console.log("🎤 Comando captado:", texto);

        if (texto.length > 0) {
            try { recognition.stop(); } catch(e) {}
            estado = "hablando";
            if (statusText) statusText.textContent = "Procesando...";

            let respuesta = procesarComando(texto);
            hablar(respuesta, () => {
                // Volver a modo reposo esperando aplausos para la siguiente vez
                estado = "esperando_aplausos";
                if (statusText) statusText.textContent = "Da 2 aplausos para activar a Jarvis...";
                detectarPicosDeSonido();
            });
        }
    };

    recognition.onerror = () => {
        if (estado === "escuchando_comando") {
            estado = "esperando_aplausos";
            if (statusText) statusText.textContent = "Da 2 aplausos para activar a Jarvis...";
            detectarPicosDeSonido();
        }
    };

    recognition.onend = () => {
        if (estado === "escuchando_comando") {
            estado = "esperando_aplausos";
            if (statusText) statusText.textContent = "Da 2 aplausos para activar a Jarvis...";
            detectarPicosDeSonido();
        }
    };

    // Respuestas inteligentes locales
    function procesarComando(texto) {
        if (texto.includes("albert einstein")) {
            return "Albert Einstein fue un físico teórico revolucionario, célebre por formular la teoría de la relatividad.";
        } else if (texto.includes("tiempo") || texto.includes("clima")) {
            return "Se prevén cielos despejados y temperaturas agradables para los próximos días.";
        } else if (texto.includes("qué puedes hacer")) {
            return "Puedo buscar información, resolver dudas, darte la hora exacta y asistirte con comandos de voz.";
        } else if (texto.includes("preséntate") || texto.includes("quién eres")) {
            return "Hola, soy Jarvis, tu asistente virtual inteligente integrado en la web.";
        } else if (texto.includes("hora")) {
            const d = new Date();
            return `Son las ${d.getHours()} horas y ${d.getMinutes()} minutos.`;
        } else {
            return `He registrado tu orden sobre ${texto}. Ejecutando análisis.`;
        }
    }

    // 3. Sistema de voz en alta definición optimizado
    function hablar(mensaje, callbackFin) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(mensaje);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 0.95; // Tono más natural y serio

        // Seleccionar la mejor voz en español disponible en el dispositivo
        const voces = window.speechSynthesis.getVoices();
        const vozHD = voces.find(v => 
            (v.lang.includes('es') || v.lang.includes('ES')) && 
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Lucia') || v.name.includes('Pablo') || v.name.includes('Helena'))
        ) || voces.find(v => v.lang.includes('es'));

        if (vozHD) {
            utterance.voice = vozHD;
        }

        utterance.onstart = () => {
            if (statusText) statusText.textContent = "Jarvis hablando...";
        };

        utterance.onend = () => {
            if (callbackFin) callbackFin();
        };

        utterance.onerror = () => {
            if (callbackFin) callbackFin();
        };

        window.speechSynthesis.speak(utterance);
    }

    // Iniciar con un clic en la pantalla (permisos de audio del navegador)
    document.addEventListener("click", () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (!micStream) {
            iniciarDetectorDeAplausos();
        }
    }, { once: true });
}
