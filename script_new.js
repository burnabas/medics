// Authentication state
let currentUser = null;

// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatApp = document.getElementById('chat-app');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const logoutButton = document.getElementById('logout-button');
const usernameDisplay = document.getElementById('username-display');
const profilePicInput = document.getElementById('profilePictureInput');
const profilePicImg = document.getElementById('profilePicture');

// Local Storage Keys
const USERS_KEY = 'medical_chat_users';
const CHAT_HISTORY_KEY = 'medical_chat_history';
const PROFILE_PICTURE_KEY = 'userProfilePicture';

// Initialize local storage
if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(CHAT_HISTORY_KEY)) {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify({}));
}

// Authentication Functions
async function login(username, password) {
    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY));
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            currentUser = user;
            showChatApp();
            loadChatHistory();
            return true;
        } else {
            throw new Error('Invalid username or password');
        }
    } catch (error) {
        showError(error.message);
        return false;
    }
}

async function register(username, email, password) {
    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY));
        
        // Check if user exists
        if (users.some(u => u.username === username)) {
            throw new Error('Username already exists');
        }
        if (users.some(u => u.email === email)) {
            throw new Error('Email already exists');
        }
        
        // Add new user
        const newUser = { username, email, password };
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        showLoginBox();
        showSuccess('Registration successful! Please login.');
        return true;
    } catch (error) {
        showError(error.message);
        return false;
    }
}

function logout() {
    currentUser = null;
    showAuthContainer();
}

// Chat History Functions
function saveChatHistory(message, response) {
    if (!currentUser) return;
    
    const chatHistory = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY));
    if (!chatHistory[currentUser.username]) {
        chatHistory[currentUser.username] = [];
    }
    
    chatHistory[currentUser.username].push({
        message,
        response,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
}

function loadChatHistory() {
    if (!currentUser) return;
    
    const chatHistory = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY));
    const userHistory = chatHistory[currentUser.username] || [];
    
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';
    
    userHistory.forEach(chat => {
        addMessageToChat('user', chat.message, chat.timestamp);
        addMessageToChat('bot', chat.response, chat.timestamp);
    });
}

// UI Functions
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background-color: #ffebee;
        color: #c62828;
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        text-align: center;
    `;
    
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add the new error message
    const activeForm = registerBox.style.display === 'block' ? registerBox : loginBox;
    activeForm.insertBefore(errorDiv, activeForm.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        background-color: #e8f5e9;
        color: #2e7d32;
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        text-align: center;
    `;
    
    // Remove any existing success messages
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Add the new success message
    const activeForm = registerBox.style.display === 'block' ? registerBox : loginBox;
    activeForm.insertBefore(successDiv, activeForm.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

function showChatApp() {
    authContainer.style.display = 'none';
    chatApp.style.display = 'block';
    usernameDisplay.textContent = currentUser.username;
    profilePicImg.src = localStorage.getItem(PROFILE_PICTURE_KEY);
}

function showAuthContainer() {
    authContainer.style.display = 'flex';
    chatApp.style.display = 'none';
    loginBox.style.display = 'block';
    registerBox.style.display = 'none';
}

function showLoginBox() {
    loginBox.style.display = 'block';
    registerBox.style.display = 'none';
}

function showRegisterBox() {
    loginBox.style.display = 'none';
    registerBox.style.display = 'block';
}

// Profile picture handling
function initializeProfilePicture() {
    const profilePicInput = document.getElementById('profilePictureInput');
    const profilePicImg = document.getElementById('profilePicture');
    
    // Load saved profile picture if exists
    const savedProfilePic = localStorage.getItem(PROFILE_PICTURE_KEY);
    if (savedProfilePic) {
        profilePicImg.src = savedProfilePic;
    }

    profilePicInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Please select an image smaller than 5MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                profilePicImg.src = e.target.result;
                // Save to localStorage
                localStorage.setItem(PROFILE_PICTURE_KEY, e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Chat functionality
function formatDateTime(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleString('en-US', options);
}

function addMessageToChat(sender, message, timestamp = new Date()) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'message-timestamp';
    timestampDiv.textContent = formatDateTime(timestamp);
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timestampDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    await login(username, password);
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    await register(username, email, password);
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterBox();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginBox();
});

logoutButton.addEventListener('click', logout);

// Medical knowledge base
const medicalKnowledge = {
    "headache": {
        "description": "A pain in the head or upper neck",
        "causes": [
            "Stress and tension",
            "Dehydration",
            "Lack of sleep",
            "Eye strain",
            "Sinus pressure"
        ],
        "recommendations": [
            "Rest in a quiet, dark room",
            "Stay hydrated",
            "Take over-the-counter pain relievers",
            "Apply a cold or warm compress",
            "Practice stress-relief techniques"
        ]
    },
    "fever": {
        "description": "A temporary increase in body temperature",
        "causes": [
            "Viral infections",
            "Bacterial infections",
            "Heat exhaustion",
            "Inflammatory conditions"
        ],
        "recommendations": [
            "Rest and get plenty of sleep",
            "Stay hydrated",
            "Take fever-reducing medication",
            "Use a light blanket",
            "Monitor temperature regularly"
        ]
    },
    "malaria": {
        "description": "A serious mosquito-borne disease caused by a parasite that commonly causes high fever, chills, and flu-like symptoms",
        "causes": [
            "Plasmodium parasites transmitted through mosquito bites",
            "Travel to malaria-endemic regions",
            "Lack of preventive measures against mosquitoes",
            "Weakened immune system"
        ],
        "recommendations": [
            "Seek immediate medical attention if malaria is suspected",
            "Take prescribed antimalarial medications",
            "Use mosquito nets while sleeping",
            "Wear long-sleeved clothing",
            "Use insect repellent",
            "Stay in screened or air-conditioned rooms"
        ]
    },
    "covid 19": {
        "description": "A respiratory illness caused by the SARS-CoV-2 virus, which can range from mild to severe symptoms",
        "causes": [
            "Exposure to the SARS-CoV-2 virus",
            "Close contact with infected individuals",
            "Airborne transmission",
            "Contact with contaminated surfaces"
        ],
        "recommendations": [
            "Get vaccinated and stay up to date with boosters",
            "Wear masks in high-risk situations",
            "Practice social distancing",
            "Wash hands frequently",
            "Monitor symptoms and get tested if exposed",
            "Isolate if tested positive",
            "Seek medical attention if symptoms are severe"
        ]
    },
    "common cold": {
        "description": "A viral infection of the upper respiratory tract",
        "causes": [
            "Rhinovirus",
            "Coronavirus",
            "Other respiratory viruses"
        ],
        "recommendations": [
            "Get plenty of rest",
            "Stay hydrated",
            "Use over-the-counter cold medications",
            "Try throat lozenges",
            "Use a humidifier"
        ]
    },
    "nosebleed": {
        "description": "A nosebleed (epistaxis) occurs when blood vessels in the nose break and bleed. It's a common condition that can occur spontaneously or due to trauma.",
        "causes": [
            "Dry air or dry nasal membranes",
            "Picking or scratching the nose",
            "Upper respiratory infections",
            "High blood pressure",
            "Blood-thinning medications",
            "Trauma or injury to the nose",
            "Allergies"
        ],
        "recommendations": [
            "Sit upright and lean slightly forward",
            "Pinch the soft part of your nose just below the bridge",
            "Breathe through your mouth while keeping pressure on your nose",
            "Hold this position for about 10-15 minutes",
            "Apply a cold compress or ice pack to your nose",
            "Avoid lying down or bending forward",
            "Seek medical attention if bleeding persists over 30 minutes"
        ],
        "emergency_signs": [
            "Heavy bleeding that won't stop",
            "Difficulty breathing",
            "Chest pain",
            "Frequent nosebleeds",
            "Pale skin or weakness"
        ]
    },
    "pregnancy": {
        "description": "Pregnancy is the period during which one or more offspring develops inside a woman's uterus. A typical pregnancy lasts about 40 weeks from the first day of the last menstrual period.",
        "common_signs": [
            "Missed period",
            "Nausea and vomiting (morning sickness)",
            "Breast tenderness",
            "Fatigue",
            "Frequent urination",
            "Mood changes",
            "Food cravings or aversions"
        ],
        "recommendations": [
            "Schedule regular prenatal checkups",
            "Take prescribed prenatal vitamins",
            "Maintain a healthy diet",
            "Stay hydrated",
            "Get adequate rest",
            "Exercise as recommended by healthcare provider",
            "Avoid alcohol, smoking, and certain foods"
        ],
        "seek_medical_attention": [
            "Severe abdominal pain",
            "Heavy bleeding",
            "Severe headaches",
            "Reduced fetal movement",
            "High fever",
            "Vision changes"
        ]
    }
};

async function searchWikipedia(query) {
    try {
        // Improve search accuracy by adding medical context
        const searchTerms = {
            'nose bleed': 'epistaxis nosebleed medical',
            'nose bleeding': 'epistaxis nosebleed medical',
            'pregnancy': 'pregnancy medical condition signs symptoms',
            'default': query + ' medical condition symptoms treatment'
        };

        const searchTerm = searchTerms[query.toLowerCase()] || searchTerms['default'];
        
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.query.search.length === 0) {
            return null;
        }

        // Filter out irrelevant results
        const relevantResult = searchData.query.search.find(result => 
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.snippet.toLowerCase().includes(query.toLowerCase())
        );

        if (!relevantResult) {
            return null;
        }

        // Get the page content
        const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(relevantResult.title)}&format=json&origin=*`;
        const contentResponse = await fetch(contentUrl);
        const contentData = await contentResponse.json();

        const pages = contentData.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId].extract;

        if (!extract || extract.length < 50) {  // Ensure we have meaningful content
            return null;
        }

        return {
            title: relevantResult.title,
            content: extract
        };
    } catch (error) {
        console.error('Wikipedia API Error:', error);
        return null;
    }
}

async function processUserMessage(message) {
    try {
        const lowerMessage = message.toLowerCase();
        
        // First check local knowledge base
        for (const [condition, info] of Object.entries(medicalKnowledge)) {
            if (lowerMessage.includes(condition)) {
                return formatLocalResponse(info);
            }
        }

        // Try Endless Medical API
        try {
            const options = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Key': '994068d1d8mshff332f14e707e42p137836jsnac889be4e2c7',
                    'X-RapidAPI-Host': 'endlessmedicalapi.p.rapidapi.com'
                },
                body: JSON.stringify({
                    question: message,
                    format: "detailed"
                })
            };

            const response = await fetch('https://endlessmedicalapi.p.rapidapi.com/ask', options);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.response && data.response.trim()) {
                    return formatApiResponse(data.response);
                }
            }
        } catch (error) {
            console.error('Endless Medical API Error:', error);
        }

        // If both local and Endless Medical API fail, try Wikipedia
        const wikiResult = await searchWikipedia(message);
        if (wikiResult) {
            return formatWikipediaResponse(wikiResult);
        }

        // If all attempts fail, return a helpful error message
        return formatErrorResponse(message);
    } catch (error) {
        console.error('Error processing message:', error);
        return formatErrorResponse(message);
    }
}

function formatLocalResponse(info) {
    let response = `🏥 Medical Information:\n\n`;
    response += `📝 Description:\n${info.description}\n\n`;
    response += `🔍 Common Causes:\n`;
    info.causes.forEach(cause => response += `• ${cause}\n`);
    response += `\n💡 Recommendations:\n`;
    info.recommendations.forEach(rec => response += `• ${rec}\n`);
    if (info.emergency_signs) {
        response += `\n⚠️ Emergency Signs:\n`;
        info.emergency_signs.forEach(sign => response += `• ${sign}\n`);
    }
    if (info.seek_medical_attention) {
        response += `\n⚠️ Seek Medical Attention If:\n`;
        info.seek_medical_attention.forEach(sign => response += `• ${sign}\n`);
    }
    response += `\n⚠️ Disclaimer: This information is for educational purposes only. Please consult a healthcare professional for medical advice.`;
    return response;
}

function formatApiResponse(response) {
    let formattedResponse = response
        .replace(/\n+/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();

    return `🏥 Medical Information:\n\n${formattedResponse}\n\n⚠️ Disclaimer: This information is for educational purposes only. Please consult a healthcare professional for medical advice.`;
}

function formatWikipediaResponse(wikiData) {
    // Clean up the content
    let content = wikiData.content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3)  // Take first three paragraphs
        .join('\n\n');

    // Format the response
    let response = `🏥 Medical Information about ${wikiData.title}:\n\n`;
    response += content;

    // Add source attribution
    response += `\n\n📚 Source: Wikipedia`;
    
    // Add disclaimer
    response += `\n\n⚠️ Disclaimer: This information is for educational purposes only. Please consult a healthcare professional for medical advice.`;

    return response;
}

function formatErrorResponse(message) {
    return `I apologize, but I couldn't find specific information about "${message}". Here are some general recommendations:\n\n` +
           `• Consult with a healthcare provider for accurate diagnosis and treatment\n` +
           `• Keep track of your symptoms and when they started\n` +
           `• Stay hydrated and get plenty of rest\n` +
           `• Monitor your temperature and other vital signs\n\n` +
           `⚠️ For any medical concerns, it's always best to consult with a qualified healthcare professional.`;
}

function getLocalMedicalInfo(message) {
    const lowerMessage = message.toLowerCase();
    let response = "I'm sorry, I don't have specific information about that condition. Please consult a healthcare professional for accurate medical advice.";
    
    for (const [condition, info] of Object.entries(medicalKnowledge)) {
        if (lowerMessage.includes(condition)) {
            response = `🏥 ${info.description}\n\n`;
            response += "📋 Common causes:\n";
            info.causes.forEach(cause => response += `• ${cause}\n`);
            response += "\n💡 Recommendations:\n";
            info.recommendations.forEach(rec => response += `• ${rec}\n`);
            response += "\n⚠️ Disclaimer: This information is for educational purposes only. Please consult a healthcare professional for medical advice.";
            break;
        }
    }
    
    return response;
}

// Update the sendMessage function to show loading state
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (message) {
        // Clear input and add user message
        userInput.value = '';
        addMessageToChat('user', message);
        
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';
        document.getElementById('chat-container').appendChild(typingDiv);
        
        try {
            // Get response from API
            const response = await processUserMessage(message);
            
            // Remove typing indicator
            typingDiv.remove();
            
            // Add bot response
            addMessageToChat('bot', response);
            
            // Save to chat history
            if (currentUser) {
                saveChatHistory(message, response);
            }
        } catch (error) {
            // Remove typing indicator
            typingDiv.remove();
            
            // Show error message
            addMessageToChat('bot', 'I apologize, but I encountered an error. Please try again.');
        }
    }
}

// Add CSS for typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing-indicator {
        padding: 15px !important;
    }
    .dots {
        display: flex;
        gap: 4px;
    }
    .dots span {
        width: 8px;
        height: 8px;
        background-color: var(--medical-green);
        border-radius: 50%;
        animation: bounce 1.5s infinite;
    }
    .dots span:nth-child(2) { animation-delay: 0.2s; }
    .dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
    }
`;
document.head.appendChild(style);

// Handle send button click
document.getElementById('send-button').addEventListener('click', sendMessage);

// Handle enter key
document.getElementById('user-input').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        await sendMessage();
    }
});

// Initialize the app
function initializeApp() {
    showAuthContainer();
    initializeProfilePicture();
}

initializeApp();
