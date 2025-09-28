// API base URL
const API_BASE = '';

// DOM elements
const elements = {
    loading: document.getElementById('loading'),
    clubsContainer: document.getElementById('clubsContainer'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    newClubBtn: document.getElementById('newClubBtn'),
    clubModal: document.getElementById('clubModal'),
    eventModal: document.getElementById('eventModal'),
    clubForm: document.getElementById('clubForm'),
    eventForm: document.getElementById('eventForm'),
    cancelClubBtn: document.getElementById('cancelClubBtn'),
    cancelEventBtn: document.getElementById('cancelEventBtn'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    toastIcon: document.getElementById('toastIcon')
};

// State
let clubs = [];
let currentEvents = {};

// Utility functions
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    
    // Set icon based on type
    const iconSvg = type === 'success' 
        ? '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
    
    elements.toastIcon.innerHTML = iconSvg;
    elements.toast.classList.remove('hidden');
    
    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// API functions
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(API_BASE + url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function loadClubs(searchTerm = '') {
    const url = searchTerm ? `/clubs?search=${encodeURIComponent(searchTerm)}` : '/clubs';
    return apiRequest(url);
}

async function createClub(clubData) {
    return apiRequest('/clubs', {
        method: 'POST',
        body: JSON.stringify(clubData)
    });
}

async function loadClubEvents(clubId) {
    return apiRequest(`/clubs/${clubId}/events`);
}

async function createEvent(clubId, eventData) {
    return apiRequest(`/clubs/${clubId}/events`, {
        method: 'POST',
        body: JSON.stringify(eventData)
    });
}

// UI functions
function showLoading() {
    elements.loading.classList.remove('hidden');
    elements.clubsContainer.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function renderClubs(clubsData) {
    clubs = clubsData;
    hideLoading();
    
    if (clubs.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.clubsContainer.classList.add('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.clubsContainer.classList.remove('hidden');
    
    const container = elements.clubsContainer.querySelector('.grid');
    container.innerHTML = clubs.map(club => `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${escapeHtml(club.name)}</h3>
                    ${club.description ? `<p class="text-gray-600 text-sm mb-3">${escapeHtml(club.description)}</p>` : '<p class="text-gray-400 text-sm mb-3 italic">No description provided</p>'}
                    <p class="text-xs text-gray-500">Created: ${formatDate(club.created_at)}</p>
                </div>
            </div>
            
            <div class="flex flex-col space-y-2">
                <button onclick="scheduleEvent(${club.id}, '${escapeHtml(club.name)}')" 
                        class="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors">
                    Schedule Event
                </button>
                <button onclick="toggleEvents(${club.id})" 
                        class="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors">
                    <span id="toggle-text-${club.id}">Show Events</span>
                </button>
            </div>
            
            <div id="events-${club.id}" class="hidden mt-4 border-t border-gray-200 pt-4">
                <div id="events-content-${club.id}">
                    <!-- Events will be loaded here -->
                </div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseErrorMessage(errorMessage) {
    // Parse common backend error formats
    if (errorMessage.includes('UNIQUE constraint failed')) {
        return 'A club with this name already exists';
    }
    if (errorMessage.includes('validation')) {
        return errorMessage.replace('Error: ', '');
    }
    return errorMessage;
}

function setButtonLoading(button, loading = true) {
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${button.dataset.originalText === 'Create Club' ? 'Creating...' : 'Scheduling...'}
        `;
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

async function toggleEvents(clubId) {
    const eventsContainer = document.getElementById(`events-${clubId}`);
    const toggleText = document.getElementById(`toggle-text-${clubId}`);
    
    if (eventsContainer.classList.contains('hidden')) {
        // Show events
        toggleText.textContent = 'Hide Events';
        eventsContainer.classList.remove('hidden');
        
        // Load events if not already loaded
        if (!currentEvents[clubId]) {
            await loadAndDisplayEvents(clubId);
        }
    } else {
        // Hide events
        toggleText.textContent = 'Show Events';
        eventsContainer.classList.add('hidden');
    }
}

async function loadAndDisplayEvents(clubId) {
    const eventsContent = document.getElementById(`events-content-${clubId}`);
    eventsContent.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div></div>';
    
    try {
        const response = await loadClubEvents(clubId);
        const events = response.data.events;
        currentEvents[clubId] = events;
        
        if (events.length === 0) {
            eventsContent.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No events scheduled</p>';
            return;
        }
        
        eventsContent.innerHTML = events.map(event => `
            <div class="border-l-4 border-blue-500 pl-4 py-2 mb-3 last:mb-0">
                <h4 class="font-medium text-gray-900 text-sm">${escapeHtml(event.title)}</h4>
                ${event.description ? `<p class="text-gray-600 text-xs mt-1">${escapeHtml(event.description)}</p>` : ''}
                <p class="text-blue-600 text-xs mt-1 font-medium">${formatDate(event.scheduled_date)}</p>
            </div>
        `).join('');
    } catch (error) {
        eventsContent.innerHTML = '<p class="text-red-500 text-sm text-center py-4">Failed to load events</p>';
        showToast('Failed to load events: ' + error.message, 'error');
    }
}

// Modal functions
function openClubModal() {
    elements.clubModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    elements.clubForm.reset();
}

function closeClubModal() {
    elements.clubModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openEventModal(clubId, clubName) {
    document.getElementById('eventClubId').value = clubId;
    document.getElementById('eventModalTitle').textContent = `Schedule Event for ${clubName}`;
    
    // Set minimum date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventDate').min = now.toISOString().slice(0, 16);
    
    elements.eventModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    elements.eventForm.reset();
}

function closeEventModal() {
    elements.eventModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Global functions for onclick handlers
window.scheduleEvent = openEventModal;
window.toggleEvents = toggleEvents;

// Event listeners
elements.newClubBtn.addEventListener('click', openClubModal);
elements.cancelClubBtn.addEventListener('click', closeClubModal);
elements.cancelEventBtn.addEventListener('click', closeEventModal);

// Close modals when clicking outside
[elements.clubModal, elements.eventModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (modal === elements.clubModal) closeClubModal();
            if (modal === elements.eventModal) closeEventModal();
        }
    });
});

// Search functionality
let searchTimeout;
elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const searchTerm = e.target.value.trim();
        showLoading();
        try {
            const response = await loadClubs(searchTerm);
            renderClubs(response.data);
        } catch (error) {
            hideLoading();
            showToast('Search failed: ' + error.message, 'error');
        }
    }, 300);
});

// Form submissions
elements.clubForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const formData = new FormData(e.target);
    const clubData = Object.fromEntries(formData.entries());
    
    // Client-side validation
    if (!clubData.name?.trim() || clubData.name.trim().length < 2) {
        showToast('Club name must be at least 2 characters long', 'error');
        return;
    }
    
    try {
        setButtonLoading(submitBtn, true);
        await createClub(clubData);
        showToast('Club created successfully!');
        closeClubModal();
        e.target.reset();
        
        // Reload clubs
        showLoading();
        const response = await loadClubs();
        renderClubs(response.data);
    } catch (error) {
        const errorMessage = parseErrorMessage(error.message);
        showToast('Failed to create club: ' + errorMessage, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

elements.eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const formData = new FormData(e.target);
    const eventData = Object.fromEntries(formData.entries());
    const clubId = document.getElementById('eventClubId').value;
    
    // Client-side validation
    if (!eventData.title?.trim() || eventData.title.trim().length < 2) {
        showToast('Event title must be at least 2 characters long', 'error');
        return;
    }
    
    const eventDate = new Date(eventData.scheduled_date);
    if (eventDate <= new Date()) {
        showToast('Event date must be in the future', 'error');
        return;
    }
    
    try {
        setButtonLoading(submitBtn, true);
        await createEvent(clubId, eventData);
        showToast('Event scheduled successfully!');
        closeEventModal();
        e.target.reset();
        
        // Refresh events for this club if they're currently displayed
        if (currentEvents[clubId] !== undefined) {
            await loadAndDisplayEvents(clubId);
        }
    } catch (error) {
        const errorMessage = parseErrorMessage(error.message);
        showToast('Failed to schedule event: ' + errorMessage, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// Initialize app
async function init() {
    showLoading();
    try {
        const response = await loadClubs();
        renderClubs(response.data);
    } catch (error) {
        hideLoading();
        showToast('Failed to load clubs: ' + error.message, 'error');
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
