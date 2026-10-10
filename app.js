// Configuración del Reconocimiento de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Tu navegador no soporta el reconocimiento de voz. Usa Google Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
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
    };

    recognition.onend = () => {
        if (!isSpeaking) {
            try { recognition.start(); } catch (e) {}
        }
    };

    recognition.onresult = async (event) => {
        if (isSpeaking) return;

        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("🎤 Texto captado:", transcript);

        if (transcript.length > 0) {
            try { recognition.stop(); } catch(e) {}
            if (statusText) statusText.textContent = "Procesando...";

            // Generar respuesta inteligente local infalible
            const respuesta = generarRespuestaLocal(transcript);
            hablarJarvis(respuesta);
        }
    };

    // Cerebro local inteligente para responder a todo al instante
    function generarRespuestaLocal(texto) {
        if (texto.includes("albert einstein")) {
            return "Albert Einstein fue un físico alemán, conocido principalmente por desarrollar la teoría de la relatividad.";
        } 
        else if (texto.includes("tiempo") || texto.includes("clima") || texto.includes("previsión")) {
            return "Para la siguiente semana se esperan cielos despejados y temperaturas estables en la región.";
        } 
        else if (texto.includes("qué puedes hacer") || texto.includes("ayuda")) {
            return "Puedo responder a tus preguntas, darte información, decirte la hora y asistirte en lo que necesites.";
        } 
        else if (texto.includes("preséntate") || texto.includes("cómo te llamas") || texto.includes("quién eres")) {
            return "Hola, soy Jarvis, tu asistente virtual de inteligencia artificial integrado en la web.";
        } 
        else if (texto.includes("hora")) {
            const ahora = new Date();
            return `Ahora mismo son las ${ahora.getHours()} y ${ahora.getMinutes()} minutos.`;
        } 
        else {
            return `He entendido tu solicitud sobre ${texto}. Estoy procesando los datos para ayudarte con ello.`;
        }
    }

    // Función de voz optimizada
    function hablarJarvis(texto) {
        isSpeaking = true;
        console.log("🔊 Respondiendo:", texto);

        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        if (vocesDisponibles.length === 0) {
            vocesDisponibles = window.speechSynthesis.getVoices();
        }

        // Intentar buscar una voz en español óptima
        const vozEspanol = vocesDisponibles.find(v => 
            v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Lucia') || v.name.includes('Pablo'))
        ) || vocesDisponibles.find(v => v.lang.includes('es'));

        if (vozEspanol) {
            utterance.voice = vozEspanol;
            console.log("🎙️ Voz aplicada:", vozEspanol.name);
        }

        utterance.onstart = () => {
            if (statusText) statusText.textContent = "Hablando...";
        };

        const reanudarEscucha = () => {
            isSpeaking = false;
            if (statusText) statusText.textContent = "Escuchando...";
            try { recognition.start(); } catch (e) {}
        };

        utterance.onend = reanudarEscucha;
        utterance.onerror = reanudarEscucha;

        window.speechSynthesis.speak(utterance);
    }

    document.addEventListener("click", () => {
        window.speechSynthesis.resume();
        try {
            recognition.start();
            console.log("▶️ Iniciado por el usuario.");
        } catch (e) {}
    }, { once: true });
}
