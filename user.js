// User Dashboard JavaScript
class UserDashboard {
    constructor() {
        this.userMobile = null;
        this.currentSection = 'new-ticket';
        this.init();
    }

    init() {
        this.checkUserAccess();
        this.setupEventListeners();
        this.loadUserData();
        this.loadMyTickets();
        this.updateUserStats();
        this.initializeChart();
    }

    checkUserAccess() {
        this.userMobile = sessionStorage.getItem('userMobile');
        if (!this.userMobile) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    setupEventListeners() {
        // Issue type selection
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectCategory(card);
            });
        });

        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('screenshot');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#3498db';
                uploadArea.style.background = 'rgba(52, 152, 219, 0.05)';
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#ddd';
                uploadArea.style.background = '#ecf0f1';
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#ddd';
                uploadArea.style.background = '#ecf0f1';
                
                if (e.dataTransfer.files.length) {
                    this.handleFileUpload(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }

        // Form submission
        const ticketForm = document.getElementById('ticketForm');
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitTicket();
            });
        }

        // Filter changes
        const filterStatus = document.getElementById('filterMyStatus');
        const filterType = document.getElementById('filterMyType');
        
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.loadMyTickets());
        }
        
        if (filterType) {
            filterType.addEventListener('change', () => this.loadMyTickets());
        }

        // Modal close
        const closeModal = document.querySelector('.close-modal');
        const modal = document.getElementById('ticketModal');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    loadUserData() {
        // Update mobile number display
        const mobileElement = document.getElementById('userMobile');
        if (mobileElement) {
            mobileElement.textContent = this.userMobile;
        }

        // Set user name if available
        const db = Database.getDB();
        const user = db.users?.find(u => u.mobile === this.userMobile);
        const userName = document.getElementById('userName');
        
        if (userName && user?.name) {
            userName.value = user.name;
        }
    }

    selectCategory(card) {
        // Remove selected class from all cards
        document.querySelectorAll('.category-card').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Add selected class to clicked card
        card.classList.add('selected');
        
        // Update hidden input
        const issueType = card.getAttribute('data-type');
        document.getElementById('issueType').value = issueType;
    }

    handleFileUpload(file) {
        if (!file.type.match('image.*')) {
            showToast('Please upload an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('File size must be less than 5MB', 'error');
            return;
        }

        this.previewFile(file);
    }

    previewFile(file) {
        const reader = new FileReader();
        const previewContainer = document.getElementById('filePreview');
        
        reader.onload = (e) => {
            previewContainer.innerHTML = `
                <div class="preview-container">
                    <img src="${e.target.result}" alt="Preview" class="preview-image">
                    <div class="preview-info">
                        <h4>${file.name}</h4>
                        <p>${(file.size / 1024).toFixed(1)} KB • ${file.type}</p>
                        <button class="remove-btn" onclick="userDashboard.removePreview()">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            previewContainer.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    }

    removePreview() {
        const previewContainer = document.getElementById('filePreview');
        const fileInput = document.getElementById('screenshot');
        
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        
        if (fileInput) {
            fileInput.value = '';
        }
    }

    getScreenshotData() {
        const previewImg = document.querySelector('.preview-image');
        return previewImg ? previewImg.src : null;
    }

    submitTicket() {
        // Validate form
        if (!this.validateForm()) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        // Get form data
        const name = document.getElementById('userName').value.trim();
        const department = document.getElementById('userDept').value;
        const email = document.getElementById('userEmail').value.trim();
        const location = document.getElementById('userLocation').value;
        const issueType = document.getElementById('issueType').value;
        const description = document.getElementById('issueDesc').value.trim();
        const priority = document.querySelector('input[name="priority"]:checked').value;
        const screenshot = this.getScreenshotData();

        // Create ticket
        const ticketData = {
            name: name,
            mobile: this.userMobile,
            rollNumber: '',
            department: department,
            email: email,
            location: location,
            issueType: issueType,
            description: description,
            urgency: priority,
            screenshot: screenshot
        };

        const ticket = Database.addTicket(ticketData);
        
        // Update user name in database if provided
        if (name) {
            const db = Database.getDB();
            const user = db.users.find(u => u.mobile === this.userMobile);
            if (user && !user.name) {
                user.name = name;
                Database.saveDB(db);
            }
        }

        // Clear form
        this.clearForm();
        
        // Show success message
        showToast(`Ticket submitted successfully! ID: ${ticket.id}`, 'success');
        
        // Switch to tickets section
        this.showSection('my-tickets');
        this.loadMyTickets();
        this.updateUserStats();
    }

    validateForm() {
        let isValid = true;
        
        // Check required fields
        const requiredFields = ['userName', 'userDept', 'issueType', 'issueDesc'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                isValid = false;
                this.highlightError(field);
            } else {
                this.removeErrorHighlight(field);
            }
        });

        // Check if category is selected
        const selectedCategory = document.querySelector('.category-card.selected');
        if (!selectedCategory) {
            isValid = false;
            showToast('Please select an issue type', 'error');
        }

        return isValid;
    }

    highlightError(field) {
        field.style.borderColor = '#e74c3c';
        field.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
    }

    removeErrorHighlight(field) {
        field.style.borderColor = '#ddd';
        field.style.boxShadow = 'none';
    }

    clearForm() {
        document.getElementById('ticketForm').reset();
        
        // Clear category selection
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Clear file preview
        this.removePreview();
        
        // Reset issue type
        document.getElementById('issueType').value = '';
    }

    loadMyTickets() {
        const db = Database.getDB();
        let userTickets = (db.tickets || []).filter(t => t.mobile === this.userMobile);
        
        // Apply filters
        const statusFilter = document.getElementById('filterMyStatus')?.value;
        const typeFilter = document.getElementById('filterMyType')?.value;
        
        if (statusFilter && statusFilter !== 'all') {
            userTickets = userTickets.filter(t => t.status === statusFilter);
        }
        
        if (typeFilter && typeFilter !== 'all') {
            userTickets = userTickets.filter(t => t.issueType === typeFilter);
        }

        const container = document.getElementById('myTicketsList');
        if (!container) return;

        if (userTickets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ticket-alt"></i>
                    <p>No tickets found</p>
                    <p class="subtext">Submit your first ticket above</p>
                </div>
            `;
            return;
        }

        // Sort by date (newest first)
        userTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = userTickets.map(ticket => `
            <div class="ticket-item ${ticket.status}" onclick="userDashboard.viewTicketDetails('${ticket.id}')">
                <div class="ticket-header">
                    <span class="ticket-id">${ticket.id}</span>
                    <span class="ticket-status status-${ticket.status}">
                        ${ticket.status.replace('-', ' ').toUpperCase()}
                    </span>
                </div>
                <h4>${ticket.issueType.charAt(0).toUpperCase() + ticket.issueType.slice(1)} Issue</h4>
                <div class="ticket-category">
                    <i class="fas fa-${this.getCategoryIcon(ticket.issueType)}"></i>
                    ${ticket.issueType}
                </div>
                <p class="ticket-urgency urgency-${ticket.urgency}">
                    <i class="fas fa-exclamation-circle"></i>
                    ${ticket.urgency.toUpperCase()} Priority
                </p>
                <p class="ticket-description">${ticket.description.substring(0, 100)}...</p>
                <p class="ticket-date">
                    <i class="far fa-calendar"></i>
                    ${new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
                <div class="ticket-actions">
                    <button class="btn-view" onclick="event.stopPropagation(); userDashboard.viewTicketDetails('${ticket.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    getCategoryIcon(category) {
        const icons = {
            laptop: 'laptop',
            printer: 'print',
            networking: 'network-wired',
            software: 'code',
            hardware: 'microchip',
            other: 'question-circle'
        };
        return icons[category] || 'question-circle';
    }

    viewTicketDetails(ticketId) {
        const db = Database.getDB();
        const ticket = db.tickets.find(t => t.id === ticketId);
        
        if (!ticket) return;

        const modal = document.getElementById('ticketModal');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalContent) return;

        const departments = {
            'cse': 'Computer Science',
            'it': 'Information Technology',
            'ece': 'Electronics',
            'mech': 'Mechanical',
            'civil': 'Civil',
            'science': 'Science',
            'management': 'Management',
            'admin': 'Administration'
        };

        modalContent.innerHTML = `
            <div class="ticket-details-modal">
                <div class="ticket-header-modal">
                    <h2>${ticket.id}</h2>
                    <div class="ticket-meta">
                        <span class="ticket-status status-${ticket.status}">
                            ${ticket.status.toUpperCase()}
                        </span>
                        <span class="urgency-badge ${ticket.urgency}">
                            ${ticket.urgency.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-section">
                        <h3><i class="fas fa-info-circle"></i> Ticket Information</h3>
                        <div class="info-row">
                            <strong>Category:</strong>
                            <span>${ticket.issueType.charAt(0).toUpperCase() + ticket.issueType.slice(1)}</span>
                        </div>
                        <div class="info-row">
                            <strong>Department:</strong>
                            <span>${departments[ticket.department] || ticket.department}</span>
                        </div>
                        <div class="info-row">
                            <strong>Location:</strong>
                            <span>${ticket.location || 'Not specified'}</span>
                        </div>
                        <div class="info-row">
                            <strong>Submitted:</strong>
                            <span>${new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>
                        ${ticket.updatedAt !== ticket.createdAt ? `
                        <div class="info-row">
                            <strong>Last Updated:</strong>
                            <span>${new Date(ticket.updatedAt).toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="detail-section">
                        <h3><i class="fas fa-user"></i> Your Information</h3>
                        <div class="info-row">
                            <strong>Name:</strong>
                            <span>${ticket.name}</span>
                        </div>
                        <div class="info-row">
                            <strong>Mobile:</strong>
                            <span>${ticket.mobile}</span>
                        </div>
                        ${ticket.email ? `
                        <div class="info-row">
                            <strong>Email:</strong>
                            <span>${ticket.email}</span>
                        </div>
                        ` : ''}
                        ${ticket.assignedTo ? `
                        <div class="info-row">
                            <strong>Assigned To:</strong>
                            <span>${ticket.assignedTo}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-comment"></i> Issue Description</h3>
                    <div class="description-box">
                        ${ticket.description}
                    </div>
                </div>
                
                ${ticket.screenshot ? `
                <div class="detail-section">
                    <h3><i class="fas fa-camera"></i> Attached Screenshot</h3>
                    <div class="screenshot-box">
                        <img src="${ticket.screenshot}" alt="Screenshot" class="screenshot-image">
                    </div>
                </div>
                ` : ''}
                
                ${ticket.resolution ? `
                <div class="detail-section">
                    <h3><i class="fas fa-check-circle"></i> Resolution</h3>
                    <div class="resolution-box">
                        ${ticket.resolution}
                    </div>
                    ${ticket.resolvedAt ? `
                    <div class="info-row">
                        <strong>Resolved On:</strong>
                        <span>${new Date(ticket.resolvedAt).toLocaleString()}</span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="ticket-actions-modal">
                    <button class="btn-action" onclick="userDashboard.closeModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                    ${ticket.status !== 'resolved' ? `
                    <button class="btn-action" onclick="userDashboard.followUpTicket('${ticket.id}')">
                        <i class="fas fa-question-circle"></i> Follow Up
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('ticketModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    followUpTicket(ticketId) {
        const message = prompt('Enter follow-up message for IT support:');
        if (message) {
            showToast('Follow-up message sent to IT support', 'success');
        }
    }

    updateUserStats() {
        const db = Database.getDB();
        const userTickets = (db.tickets || []).filter(t => t.mobile === this.userMobile);
        
        const total = userTickets.length;
        const pending = userTickets.filter(t => t.status === 'pending').length;
        const progress = userTickets.filter(t => t.status === 'in-progress').length;
        const resolved = userTickets.filter(t => t.status === 'resolved').length;

        this.updateElement('myTotalTickets', total);
        this.updateElement('myPendingTickets', pending);
        this.updateElement('myProgressTickets', progress);
        this.updateElement('myResolvedTickets', resolved);

        // Update chart if exists
        this.updateStatusChart(pending, progress, resolved);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    initializeChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        this.statusChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'In Progress', 'Resolved'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#f39c12',
                        '#3498db',
                        '#2ecc71'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateStatusChart(pending, progress, resolved) {
        if (this.statusChart) {
            this.statusChart.data.datasets[0].data = [pending, progress, resolved];
            this.statusChart.update();
        }
    }

    showSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.user-nav a').forEach(link => {
            link.classList.remove('nav-active');
        });
        
        const activeLink = document.querySelector(`.user-nav a[onclick*="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('nav-active');
        }

        // Update sections
        document.querySelectorAll('.user-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Load section data
            if (sectionId === 'my-tickets') {
                this.loadMyTickets();
            } else if (sectionId === 'status') {
                this.updateUserStats();
            }
        }
    }
}

// Initialize User Dashboard
let userDashboard;

document.addEventListener('DOMContentLoaded', function() {
    userDashboard = new UserDashboard();
});

// Global functions for HTML onclick handlers
function showSection(sectionId) {
    if (userDashboard) userDashboard.showSection(sectionId);
}

function clearForm() {
    if (userDashboard) userDashboard.clearForm();
}

function loadMyTickets() {
    if (userDashboard) userDashboard.loadMyTickets();
}