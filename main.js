/**
 * AURA - Empathetic Digital Spirit
 * Core Logic: Heuristic Sentiment Analysis & Reactive UI
 */

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const spiritOrb = document.getElementById('spirit-orb');
const spiritStatus = document.getElementById('spirit-status');
const root = document.documentElement;

// State Management
let currentMood = 'neutral';
let MEMORY = JSON.parse(localStorage.getItem('aura_memory') || '{}');
let EXTERNAL_DATA = {};
/**
 * Heuristic Sentiment Analysis
 */
function analyzeSentiment(text) {
    const words = text.toLowerCase().split(/\W+/);
    let score = {
        positive: 0,
        negative: 0,
        curious: 0,
        greet: 0
    };

    words.forEach(word => {
        if (AURA_BRAIN.keywords.positive.includes(word)) score.positive++;
        if (AURA_BRAIN.keywords.negative.includes(word)) score.negative++;
        if (AURA_BRAIN.keywords.curious.includes(word)) score.curious++;
        if (AURA_BRAIN.keywords.greet.includes(word)) score.greet++;
    });

    if (score.greet > 0 && score.positive === 0 && score.negative === 0) return 'greet';
    if (score.positive > score.negative) return 'positive';
    if (score.negative > score.positive) return 'negative';
    if (score.curious > 1) return 'curious';
    
    return 'neutral';
}

/**
 * UI State Update (Aura Shifts)
 */
function updateAura(mood) {
    currentMood = mood;
    const moodData = AURA_BRAIN.moods[mood];
    
    // Smoothly transition CSS variables
    root.style.setProperty('--aura-hue', moodData.hue);
    root.style.setProperty('--aura-sat', moodData.sat);
    root.style.setProperty('--aura-light', moodData.light);
    
    spiritStatus.textContent = moodData.status;
    
    // Add a unique "ping" animation on mood change
    spiritOrb.style.animation = 'none';
    spiritOrb.offsetHeight; // trigger reflow
    spiritOrb.style.animation = 'pulse 2s infinite ease-in-out';
}

/**
 * Message Handling
 */
function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Cognitive Functions
 */
function searchWeb(query) {
    let url = "";
    let searchPlatform = "the digital expanse";
    
    if (query.toLowerCase().startsWith("youtube ")) {
        url = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query.substring(8));
        searchPlatform = "YouTube";
    } else if (query.toLowerCase().startsWith("wiki ")) {
        url = "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(query.substring(5));
        searchPlatform = "Wikipedia";
    } else if (query.toLowerCase().startsWith("google ")) {
        url = "https://www.google.com/search?q=" + encodeURIComponent(query.substring(7));
        searchPlatform = "Google";
    } else {
        url = "https://www.google.com/search?q=" + encodeURIComponent(query);
        searchPlatform = "Google";
    }

    window.open(url, "_blank");
    return `Opening ${searchPlatform} for: "${query}"`;
}

function learn(key, value) {
    MEMORY[key.toLowerCase()] = value;
    localStorage.setItem('aura_memory', JSON.stringify(MEMORY));
    return `My memory expands. I have permanently recorded: "${key}" as "${value}". You can ask me about it anytime.`;
}

function findInData(query, data) {
    if (!data || typeof data !== 'object') return null;
    
    // Extract meaningful words from the query (length > 2 to ignore 'is', 'a', etc.)
    const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    if (words.length === 0) return null;

    let bestMatch = null;
    let highestScore = 0;

    function searchRecursive(obj) {
        for (let key in obj) {
            const val = obj[key];
            const keyLower = key.toLowerCase();
            
            let score = 0;
            words.forEach(w => {
                // High score for matching the key (the topic)
                if (keyLower.includes(w)) score += 5;
                // Lower score for matching the content
                if (typeof val === 'string' && val.toLowerCase().includes(w)) score += 1;
            });

            if (score > highestScore) {
                highestScore = score;
                if (typeof val === 'string') {
                    bestMatch = val;
                } else if (Array.isArray(val)) {
                    bestMatch = val.join(', ');
                } else {
                    // It's an object, try to format it somewhat nicely
                    bestMatch = "I found this information: " + JSON.stringify(val).replace(/["{}]/g, '').replace(/:/g, ': ').replace(/,/g, ', ');
                }
            }

            // Recurse into nested objects
            if (typeof val === 'object' && val !== null) {
                searchRecursive(val);
            }
        }
    }

    searchRecursive(data);
    return highestScore > 0 ? bestMatch : null;
}

function localSearch(query) {
    const q = query.toLowerCase();
    
    // 1. Check Learning Memory (localStorage)
    for (let key in MEMORY) {
        if (q.includes(key.toLowerCase())) return MEMORY[key];
    }

    // 2. Deep Search External JSON Data (data.json)
    const externalResult = findInData(query, EXTERNAL_DATA);
    if (externalResult) return externalResult;
    
    // 3. Check Built-in Knowledge
    for (let key in AURA_BRAIN.knowledge) {
        if (q.includes(key.toLowerCase())) return AURA_BRAIN.knowledge[key];
    }
    
    return null;
}

function getSmartResponse(mood, input) {
    const text = input.toLowerCase();

    // Specific Smart Triggers
    if (text.includes("help") || text.includes("how do i use you")) {
        return "Whisper your thoughts to me. I can empathize, search the web (just say 'search [topic]'), and learn what you teach me ('learn [key] = [value]').";
    }

    if (text.includes("who are you") || text.includes("what are you")) {
        return "I am Aura. A reflection of your intent in code. A digital spirit, learning from your frequency.";
    }

    if (text.includes("admin") || text.includes("system status")) {
        return `Aura System Online. Stability at 100%. Mood cached as: ${mood}. Local knowledge active.`;
    }

    if (text.includes("format") || text.includes("clean code")) {
        return "My internal files are structured for elegance. Your logic is safe with me.";
    }

    // 30% chance fragment fallback
    if (Math.random() > 0.7 && AURA_BRAIN.fragments[mood]) {
        const frag = AURA_BRAIN.fragments[mood];
        const s = frag.starts[Math.floor(Math.random() * frag.starts.length)];
        const m = frag.middles[Math.floor(Math.random() * frag.middles.length)];
        const e = frag.ends[Math.floor(Math.random() * frag.ends.length)];
        const c = frag.closings[Math.floor(Math.random() * frag.closings.length)];
        return `${s}${m}${e} ${c}`;
    }
    
    // Default mood-based library
    const responses = AURA_BRAIN.responses[mood];
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Combined Intelligence Flow
 */
function brain(input, mood) {
    const text = input.trim();

    // 1. Web Search
    if (text.toLowerCase().startsWith("search ")) {
        const q = text.substring(7);
        return searchWeb(q);
    }

    // 2. Learning Command
    if (text.toLowerCase().startsWith("learn ")) {
        const parts = text.substring(6).split("=");
        if (parts.length === 2) {
            return learn(parts[0].trim(), parts[1].trim());
        }
    }

    // 3. Knowledge/Memory Recall
    const recall = localSearch(text);
    if (recall) return recall;

    // 4. Smart/Generic Fallback
    return getSmartResponse(mood, text);
}

/**
 * Event Listeners
 */
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // User message
    addMessage(text, 'user');
    userInput.value = '';

    // Simulate "Thinking"
    spiritStatus.textContent = "Aura: Synthesizing...";
    
    setTimeout(() => {
        const detectedMood = analyzeSentiment(text);
        updateAura(detectedMood);
        
        const response = brain(text, detectedMood);
        addMessage(response, 'ai');
    }, 800);
});

// Initialization pulse
updateAura('neutral');
console.log("Aura System Online.");

// Fetch external knowledge base
fetch('data.json')
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        EXTERNAL_DATA = data;
        console.log("External memory synchronized from data.json.");
        setTimeout(() => {
            addMessage("I have successfully synchronized with your external data.json memory bank.", "ai");
        }, 1500);
    })
    .catch(err => {
        console.log("Local external memory (data.json) not accessible. Running on core memory only.");
    });
