const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Usa Google Chrome para compatibilidad.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    const statusText = document.querySelector('.status-text') || document.body;
    
    let estado = "esperando_aplausos"; 
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let contadorAplausos = 0;
    let tiempoUltimoAplauso = 0;

    // 1. Configurar detector de aplausos preciso
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
            console.error("Error al acceder al micrófono:", e);
            if (statusText) statusText.textContent = "Haz clic en la pantalla para activar.";
        }
    }

    function detectarPicosDeSonido() {
        if (estado !== "esperando_aplausos") return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        let suma = 0;
        for (let i = 0; i < dataArray.length; i++) {
            suma += dataArray[i];
        }
        let volumen = suma / dataArray.length;

        // Umbral estricto para aplausos secos y fuertes (> 55)
        if (volumen > 55) {
            const ahora = Date.now();
            if (ahora - tiempoUltimoAplauso > 1200) {
                contadorAplausos = 0;
            }

            contadorAplausos++;
            tiempoUltimoAplauso = ahora;
            console.log(`👏 ¡Aplauso detectado! (${contadorAplausos}/2)`);

            if (contadorAplausos === 2) {
                contadorAplausos = 0;
                activarJarvisPorAplausos();
                return;
            }

            setTimeout(detenerBreve, 400);
            return;
        }

        requestAnimationFrame(detectarPicosDeSonido);
    }

    function detenerBreve() {
        setTimeout(() => {
            if (estado === "esperando_aplausos") {
                detectarPicosDeSonido();
            }
        }, 400);
    }

    function activarJarvisPorAplausos() {
        estado = "hablando";
        if (statusText) statusText.textContent = "¡Activado!";
        console.log("⚡ ¡Dos aplausos detectados! Activando asistente...");

        hablar("Sistema activado. ¿Qué deseas hacer?", () => {
            estado = "escuchando_comando";
            if (statusText) statusText.textContent = "Te escucho...";
            try {
                recognition.start();
            } catch (e) {}
        });
    }

    // 2. Procesar órdenes del usuario
    recognition.onresult = (event) => {
        if (estado !== "escuchando_comando") return;

        const texto = event.results[0][0].transcript.toLowerCase().trim();
        console.log("🎤 Comando captado:", texto);

        if (texto.length > 0) {
            try { recognition.stop(); } catch(e) {}
            estado = "hablando";
            if (statusText) statusText.textContent = "Procesando...";

            let respuesta = procesarComandoInteligente(texto);
            hablar(respuesta, () => {
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

    // Cerebro mejorado con respuestas detalladas y acciones reales (como abrir YouTube)
    function procesarComandoInteligente(texto) {
        if (texto.includes("lionel messi") || texto.includes("messi")) {
            return "Lionel Messi es un futbolista argentino considerado uno de los mejores jugadores de la historia, ganador de múltiples balones de oro y campeón del mundo en dos mil veintidós.";
        } 
        else if (texto.includes("youtube") || texto.includes("abre youtube")) {
            window.open("https://www.youtube.com", "_blank");
            return "Abriendo YouTube en una nueva pestaña.";
        } 
        else if (texto.includes("tiempo") || texto.includes("clima") || texto.includes("previsión")) {
            return "Para la próxima semana se esperan cielos mayormente despejados y temperaturas agradables.";
        } 
        else if (texto.includes("albert einstein")) {
            return "Albert Einstein fue un físico alemán creador de la teoría de la relatividad, una de las bases de la física moderna.";
        } 
        else if (texto.includes("qué puedes hacer") || texto.includes("ayuda")) {
            return "Puedo buscar biografías, abrir páginas como YouTube, decirte la hora, darte previsiones y responder a tus preguntas.";
        } 
        else if (texto.includes("preséntate") || texto.includes("quién eres")) {
            return "Hola, soy Jarvis, tu asistente virtual inteligente integrado en la web.";
        } 
        else if (texto.includes("hora")) {
            const d = new Date();
            return `Son las ${d.getHours()} horas y ${d.getMinutes()} minutos.`;
        } 
        else if (texto.includes("chiste")) {
            return "Va un caracol y se sube a un tren, y dice: ¡Uff, qué velocidad! ¡Quítate que me atropellas!";
        }
        else {
            return `Has preguntado sobre "${texto}". Es un tema interesante, aunque mis bases de datos locales todavía están aprendiendo sobre ello.`;
        }
    }

    // 3. Sistema de voz natural HD
    function hablar(mensaje, callbackFin) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(mensaje);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 0.95;

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

    document.addEventListener("click", () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (!micStream) {
            iniciarDetectorDeAplausos();
        }
    }, { once: true });
}
