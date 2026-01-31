// Main JavaScript for Campus IT Support System

// Database simulation
const Database = {
    // Initialize database
    init: function() {
        if (!localStorage.getItem('campusDB')) {
            const initialDB = {
                users: [],
                tickets: [],
                admins: [{ username: 'admin', password: 'admin123', name: 'Administrator' }],
                settings: {
                    systemName: 'Campus IT Support',
                    categories: ['laptop', 'printer', 'networking', 'software', 'hardware', 'other'],
                    technicians: ['John', 'Sarah', 'Mike', 'Priya'],
                    autoCloseDays: 30
                },
                statistics: {
                    totalTickets: 0,
                    pendingTickets: 0,
                    resolvedTickets: 0
                }
            };
            localStorage.setItem('campusDB', JSON.stringify(initialDB));
        }
        return this.getDB();
    },

    // Get database
    getDB: function() {
        return JSON.parse(localStorage.getItem('campusDB'));
    },

    // Save database
    saveDB: function(db) {
        localStorage.setItem('campusDB', JSON.stringify(db));
    },

    // Add new user
    addUser: function(mobile, name = '') {
        const db = this.getDB();
        const existingUser = db.users.find(u => u.mobile === mobile);
        
        if (!existingUser) {
            db.users.push({
                mobile: mobile,
                name: name,
                tickets: [],
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            });
            this.saveDB(db);
        }
        return mobile;
    },

    // Add ticket
    addTicket: function(ticketData) {
        const db = this.getDB();
        const ticketId = 'TICKET-' + (db.tickets.length + 1001);
        
        const ticket = {
            id: ticketId,
            ...ticketData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        db.tickets.unshift(ticket);
        
        // Update user's tickets
        const user = db.users.find(u => u.mobile === ticketData.mobile);
        if (user) {
            user.tickets.push(ticketId);
            user.lastActive = new Date().toISOString();
        }
        
        // Update statistics
        db.statistics.totalTickets++;
        db.statistics.pendingTickets++;
        
        this.saveDB(db);
        return ticket;
    },

    // Get user tickets
    getUserTickets: function(mobile) {
        const db = this.getDB();
        return db.tickets.filter(t => t.mobile === mobile);
    },

    // Get all tickets
    getAllTickets: function() {
        const db = this.getDB();
        return db.tickets;
    },

    // Update ticket status
    updateTicketStatus: function(ticketId, status, resolution = '', assignedTo = '') {
        const db = this.getDB();
        const ticket = db.tickets.find(t => t.id === ticketId);
        
        if (ticket) {
            const oldStatus = ticket.status;
            ticket.status = status;
            ticket.updatedAt = new Date().toISOString();
            
            if (resolution) ticket.resolution = resolution;
            if (assignedTo) ticket.assignedTo = assignedTo;
            if (status === 'resolved') ticket.resolvedAt = new Date().toISOString();
            
            // Update statistics
            if (oldStatus === 'pending' && status !== 'pending') {
                db.statistics.pendingTickets--;
            }
            if (oldStatus !== 'resolved' && status === 'resolved') {
                db.statistics.resolvedTickets++;
            }
            
            this.saveDB(db);
            return true;
        }
        return false;
    },

    // Delete ticket
    deleteTicket: function(ticketId) {
        const db = this.getDB();
        const index = db.tickets.findIndex(t => t.id === ticketId);
        
        if (index !== -1) {
            const ticket = db.tickets[index];
            db.tickets.splice(index, 1);
            
            // Update statistics
            db.statistics.totalTickets--;
            if (ticket.status === 'pending') db.statistics.pendingTickets--;
            if (ticket.status === 'resolved') db.statistics.resolvedTickets--;
            
            this.saveDB(db);
            return true;
        }
        return false;
    },

    // Admin login
    adminLogin: function(username, password) {
        const db = this.getDB();
        const admin = db.admins.find(a => a.username === username && a.password === password);
        return admin || null;
    }
};

// Initialize database on page load
Database.init();

// Common Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    // Clear previous
    toast.className = 'toast';
    toast.innerHTML = '';
    
    // Set type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.classList.add(`toast-${type}`);
    toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    // Show
    toast.classList.add('show');
    
    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}

// Login Functions
function userLogin() {
    const mobile = document.getElementById('user-mobile')?.value.trim();
    
    if (!mobile || !validateMobile(mobile)) {
        showToast('Please enter valid 10-digit mobile number', 'error');
        return;
    }
    
    // Add user to database if new
    Database.addUser(mobile);
    
    // Save user session
    sessionStorage.setItem('userMobile', mobile);
    
    // Redirect to user dashboard
    window.location.href = 'user.html';
}

function adminLogin() {
    const username = document.getElementById('admin-username')?.value.trim();
    const password = document.getElementById('admin-password')?.value.trim();
    
    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }
    
    const admin = Database.adminLogin(username, password);
    if (admin) {
        // Save admin session
        sessionStorage.setItem('adminUser', JSON.stringify(admin));
        window.location.href = 'admin.html';
    } else {
        showToast('Invalid admin credentials', 'error');
    }
}

function quickUserAccess() {
    // Generate random mobile for quick access
    const randomMobile = '9' + Math.floor(100000000 + Math.random() * 900000000);
    sessionStorage.setItem('userMobile', randomMobile);
    Database.addUser(randomMobile, 'Guest User');
    window.location.href = 'user.html';
}

function guestView() {
    // Show guest view modal
    const mobile = prompt('Enter your mobile number to view tickets:');
    if (mobile && validateMobile(mobile)) {
        sessionStorage.setItem('guestMobile', mobile);
        window.open('user.html', '_blank');
    }
}

function updateLoginStats() {
    const db = Database.getDB();
    
    const totalCount = document.getElementById('totalTicketsCount');
    const pendingCount = document.getElementById('pendingTicketsCount');
    const resolvedCount = document.getElementById('resolvedTicketsCount');
    
    if (totalCount) totalCount.textContent = db.statistics.totalTickets;
    if (pendingCount) pendingCount.textContent = db.statistics.pendingTickets;
    if (resolvedCount) resolvedCount.textContent = db.statistics.resolvedTickets;
}

function goToHome() {
    window.location.href = 'index.html';
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.user-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.user-nav a').forEach(nav => {
        nav.classList.remove('nav-active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Add active class to clicked nav
    event.target.classList.add('nav-active');
}

function showAdminSection(sectionId) {
    // Similar to showSection but for admin
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.admin-nav a').forEach(nav => {
        nav.classList.remove('nav-active');
    });
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    if (event && event.target) {
        event.target.classList.add('nav-active');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userMobile = sessionStorage.getItem('userMobile');
    const adminUser = sessionStorage.getItem('adminUser');
    
    if (window.location.pathname.includes('user.html') && !userMobile) {
        window.location.href = 'index.html';
    }
    
    if (window.location.pathname.includes('admin.html') && !adminUser) {
        window.location.href = 'index.html';
    }
    
    // Update user info if on user page
    if (userMobile && document.getElementById('userMobile')) {
        document.getElementById('userMobile').textContent = userMobile;
    }
    
    // Update admin info if on admin page
    if (adminUser && document.getElementById('adminName')) {
        const admin = JSON.parse(adminUser);
        document.getElementById('adminName').textContent = admin.name;
    }
    
    // Update current date
    const dateElements = document.querySelectorAll('#currentDate');
    dateElements.forEach(el => {
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    });
});