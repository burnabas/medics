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

// Medical knowledge base
const medicalKnowledge = {
    "headache": {
        description: "A pain or discomfort in the head, scalp, or neck.",
        causes: [
            "Stress and tension",
            "Dehydration",
            "Eye strain",
            "Lack of sleep",
            "Migraines",
            "Sinus problems"
        ],
        recommendations: [
            "Rest in a quiet, dark room",
            "Stay hydrated",
            "Practice stress management",
            "Get adequate sleep",
            "Consider over-the-counter pain relievers",
            "Seek medical attention if severe or persistent"
        ]
    },
    "fever": {
        description: "A temporary increase in body temperature, often due to illness.",
        causes: [
            "Viral infections",
            "Bacterial infections",
            "Heat exhaustion",
            "Inflammatory conditions",
            "Immunizations",
            "Various medical conditions"
        ],
        recommendations: [
            "Rest and stay hydrated",
            "Take fever-reducing medication if needed",
            "Keep the room temperature comfortable",
            "Wear light clothing",
            "Monitor temperature regularly",
            "Seek medical attention if fever is high or persistent"
        ]
    },
    "common cold": {
        description: "A viral infection of the upper respiratory tract.",
        causes: [
            "Rhinovirus",
            "Coronavirus",
            "Other respiratory viruses",
            "Weakened immune system",
            "Cold weather exposure",
            "Close contact with infected people"
        ],
        recommendations: [
            "Get plenty of rest",
            "Stay hydrated",
            "Use over-the-counter cold medications",
            "Try saline nasal drops",
            "Use a humidifier",
            "Practice good hand hygiene"
        ]
    }
};

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    addMessage(`Hello! I'm your Medical Assistant. I can help you with health-related questions.

For example, try asking about:
• "What causes headaches?"
• "How to treat a fever?"
• "What are common cold symptoms?"

Remember: This information is for educational purposes. For personalized medical advice, please consult a healthcare professional.`, 'bot-message');
});

// Add message to chat
function addMessage(message, className) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.innerHTML = message.replace(/\n/g, '<br>');
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Process user message
async function processUserMessage(message) {
    const query = message.toLowerCase();
    let response = '';

    // Show typing indicator
    addMessage('<div class="typing-indicator"><div class="message"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>', 'bot-message');

    try {
        // Check for specific conditions in medical knowledge base
        for (const [condition, info] of Object.entries(medicalKnowledge)) {
            if (query.includes(condition)) {
                response = await formatResponse(condition, info);
                break;
            }
        }

        // If no specific condition found, search Wikipedia
        if (!response) {
            const wikiInfo = await searchWikipedia(query);
            if (wikiInfo.length > 0) {
                response = await formatWikiResponse(wikiInfo, query);
            } else {
                response = `I apologize, but I couldn't find specific information about your query. 

Try asking about specific conditions or symptoms, such as:
• Headaches
• Fever
• Common cold

<div class="medical-notice"><i class="fas fa-heart"></i>For personalized medical advice, please consult with a qualified healthcare professional.</div>`;
            }
        }

        // Remove typing indicator
        const typingIndicator = document.querySelector('.typing-indicator').parentElement;
        typingIndicator.remove();

        // Add response
        addMessage(response, 'bot-message');
    } catch (error) {
        console.error('Error:', error);
        const typingIndicator = document.querySelector('.typing-indicator').parentElement;
        typingIndicator.remove();
        addMessage('I apologize, but I encountered an error. Please try asking your question again.', 'bot-message');
    }
}

// Format response for known medical conditions
async function formatResponse(condition, info) {
    let response = `<strong>${info.description}</strong>\n\n`;
    
    // Try to get medical image
    const image = await getMedicalImage(condition);
    if (image) {
        response += `
        <div class="image-container">
            <img src="${image.url}" alt="${image.title}" class="message-image" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
            <div class="image-error" style="display:none;">Image could not be loaded</div>
            <div class="image-caption">${image.title}</div>
        </div>\n\n`;
    }
    
    response += '<strong>Common Causes:</strong>\n';
    info.causes.forEach(cause => response += `• ${cause}\n`);
    
    response += '\n<strong>Recommendations:</strong>\n';
    info.recommendations.forEach(rec => response += `• ${rec}\n`);
    
    response += '\n<div class="medical-notice"><i class="fas fa-heart"></i>This information is provided for educational purposes. For personalized medical guidance, please consult with a qualified healthcare provider.</div>';
    
    return response;
}

// Format Wikipedia response
async function formatWikiResponse(wikiInfo, query) {
    let response = '<strong>Health Information:</strong>\n\n';
    
    // Try to get medical image
    const image = await getMedicalImage(query);
    if (image) {
        response += `
        <div class="image-container">
            <img src="${image.url}" alt="${image.title}" class="message-image" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
            <div class="image-error" style="display:none;">Image could not be loaded</div>
            <div class="image-caption">${image.title}</div>
        </div>\n\n`;
    }
    
    response += '<strong>Overview:</strong>\n';
    wikiInfo.forEach(result => {
        const cleanSnippet = result.snippet.replace(/<\/?[^>]+(>|$)/g, "");
        response += `• ${cleanSnippet}\n\n`;
    });
    
    response += '<div class="medical-notice"><i class="fas fa-heart"></i>The information provided is for general knowledge. For personalized medical advice and treatment options, please consult with a qualified healthcare professional.</div>';
    
    return response;
}

// Wikipedia API search
async function searchWikipedia(query) {
    try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=3&format=json&origin=*&srsearch=${encodeURIComponent(query + " medical condition")}`);
        const data = await response.json();
        return data.query.search;
    } catch (error) {
        console.error('Wikipedia API error:', error);
        return [];
    }
}

// Wikipedia API for medical images
async function getMedicalImage(query) {
    try {
        const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(query + " medical condition")}`);
        const searchData = await searchResponse.json();
        
        if (!searchData.query.search.length) return null;
        
        const pageTitle = searchData.query.search[0].title;
        const imageResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&format=json&origin=*`);
        const imageData = await imageResponse.json();
        
        const pages = Object.values(imageData.query.pages);
        if (!pages[0].images) return null;
        
        const relevantImages = pages[0].images.filter(img => {
            const title = img.title.toLowerCase();
            return (title.includes('.jpg') || title.includes('.png')) && 
                   !title.includes('icon') && !title.includes('logo');
        });
        
        if (!relevantImages.length) return null;
        
        const imageTitle = relevantImages[0].title;
        const urlResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(imageTitle)}&prop=imageinfo&iiprop=url&format=json&origin=*`);
        const urlData = await urlResponse.json();
        
        const imagePages = Object.values(urlData.query.pages);
        if (!imagePages[0].imageinfo) return null;
        
        return {
            url: imagePages[0].imageinfo[0].url,
            title: imageTitle.replace('File:', '').replace(/_/g, ' ').replace(/\.(jpg|png|gif)$/i, '')
        };
    } catch (error) {
        console.error('Error fetching medical image:', error);
        return null;
    }
}

// Authentication Functions
async function login(username, password) {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Login failed');
        }

        const data = await response.json();
        currentUser = data.user;
        showChatApp();
        return true;
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Error logging in. Please try again.');
        return false;
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Registration failed');
        }

        const data = await response.json();
        showLoginBox();
        showSuccess('Registration successful! Please login.');
        return true;
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message || 'Error registering. Please try again.');
        return false;
    }
}

async function logout() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        currentUser = null;
        showAuthContainer();
    } catch (error) {
        console.error('Logout error:', error);
        showError('Error logging out. Please try again.');
    }
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
    usernameDisplay.textContent = `Welcome, ${currentUser.username}!`;
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

// Save chat history
async function saveChatHistory(message, response) {
    if (!currentUser) return;
    
    try {
        await fetch('http://127.0.0.1:5000/api/save_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ message, response })
        });
    } catch (error) {
        console.error('Error saving chat:', error);
    }
}

// Modify your existing sendMessage function to save chat history
const originalSendMessage = window.sendMessage;
window.sendMessage = async function(message) {
    const response = await originalSendMessage(message);
    await saveChatHistory(message, response);
    return response;
};

// Handle send button click
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (message) {
        addMessage(message, 'user-message');
        userInput.value = '';
        await processUserMessage(message);
    }
}

// Event listeners
document.getElementById('send-button').addEventListener('click', sendMessage);

document.getElementById('user-input').addEventListener('keypress', async function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await sendMessage();
    }
});

// Initialize the app
showAuthContainer();
