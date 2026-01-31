// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.currentTicket = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.checkAdminAccess();
        this.loadAdminData();
        this.setupEventListeners();
        this.initializeCharts();
        this.updateLiveStats();
        this.startLiveUpdates();
    }

    checkAdminAccess() {
        const adminData = sessionStorage.getItem('adminUser');
        if (!adminData) {
            window.location.href = 'index.html';
            return;
        }
        this.currentUser = JSON.parse(adminData);
    }

    loadAdminData() {
        // Update admin name
        if (document.getElementById('adminName')) {
            document.getElementById('adminName').textContent = this.currentUser.name;
        }

        // Update date time
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000);

        // Load all sections
        this.loadDashboard();
        this.loadAllTickets();
        this.loadManageTickets();
        this.loadUsers();
        this.loadSettings();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.showSettingsTab(tabId);
            });
        });

        // Ticket queue switching
        document.querySelectorAll('.queue-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.queue-item').forEach(i => i.classList.remove('active'));
                e.target.classList.add('active');
                this.loadQueueTickets(e.target.textContent.trim().split(' ')[0]);
            });
        });

        // Search functionality
        const ticketSearch = document.getElementById('ticketSearch');
        if (ticketSearch) {
            ticketSearch.addEventListener('input', (e) => this.searchTickets(e.target.value));
        }

        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.ticket-checkbox');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
            });
        }

        // Date range for reports
        const reportFrom = document.getElementById('reportFrom');
        const reportTo = document.getElementById('reportTo');
        if (reportFrom && reportTo) {
            const today = new Date().toISOString().split('T')[0];
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            reportFrom.value = lastMonth.toISOString().split('T')[0];
            reportTo.value = today;
        }
    }

    updateDateTime() {
        const now = new Date();
        const dateTimeStr = now.toLocaleString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            dateTimeElement.textContent = dateTimeStr;
        }
    }

    // Dashboard Functions
    loadDashboard() {
        this.updateQuickStats();
        this.loadRecentTickets();
        this.loadUrgentTickets();
        this.loadPerformanceData();
        this.updateCategoryChart();
    }

    updateQuickStats() {
        const db = Database.getDB();
        const tickets = db.tickets || [];
        
        const total = tickets.length;
        const pending = tickets.filter(t => t.status === 'pending').length;
        const progress = tickets.filter(t => t.status === 'in-progress').length;
        const resolved = tickets.filter(t => t.status === 'resolved').length;
        const users = db.users?.length || 0;
        const urgent = tickets.filter(t => t.urgency === 'urgent' || t.urgency === 'high').length;

        // Update elements
        this.updateElement('totalTicketsAdmin', total);
        this.updateElement('pendingTicketsAdmin', pending);
        this.updateElement('progressTicketsAdmin', progress);
        this.updateElement('resolvedTicketsAdmin', resolved);
        this.updateElement('totalUsers', users);
        this.updateElement('liveTickets', total + ' Live');
        this.updateElement('urgentTickets', urgent + ' Urgent');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    loadRecentTickets() {
        const db = Database.getDB();
        const recentTickets = (db.tickets || []).slice(0, 5);
        const container = document.getElementById('recentTickets');
        
        if (!container) return;

        if (recentTickets.length === 0) {
            container.innerHTML = '<div class="empty-state">No recent tickets</div>';
            return;
        }

        container.innerHTML = recentTickets.map(ticket => `
            <div class="recent-ticket-item" onclick="adminDashboard.viewTicket('${ticket.id}')">
                <div>
                    <strong>${ticket.id}</strong>
                    <div class="ticket-category">${ticket.issueType}</div>
                </div>
                <div>
                    <span class="ticket-status status-${ticket.status}">${ticket.status}</span>
                    <div class="ticket-date">${new Date(ticket.createdAt).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
    }

    loadUrgentTickets() {
        const db = Database.getDB();
        const urgentTickets = (db.tickets || [])
            .filter(t => t.urgency === 'urgent' || t.urgency === 'high')
            .slice(0, 5);
        
        const container = document.getElementById('urgentList');
        if (!container) return;

        if (urgentTickets.length === 0) {
            container.innerHTML = '<div class="empty-state">No urgent tickets</div>';
            return;
        }

        container.innerHTML = urgentTickets.map(ticket => `
            <div class="urgent-item" onclick="adminDashboard.viewTicket('${ticket.id}')">
                <div>
                    <strong>${ticket.id}</strong>
                    <div>${ticket.name}</div>
                </div>
                <span class="priority-dot ${ticket.urgency}"></span>
            </div>
        `).join('');
    }

    loadPerformanceData() {
        const performanceData = [
            { name: 'John', resolved: 45, avgTime: '2h 30m' },
            { name: 'Sarah', resolved: 38, avgTime: '3h 15m' },
            { name: 'Mike', resolved: 52, avgTime: '2h 10m' },
            { name: 'Priya', resolved: 41, avgTime: '2h 45m' }
        ];

        const container = document.getElementById('performanceList');
        if (!container) return;

        container.innerHTML = performanceData.map(tech => `
            <div class="performance-item">
                <div>
                    <strong>${tech.name}</strong>
                    <div>Resolved: ${tech.resolved} tickets</div>
                </div>
                <div class="avg-time">${tech.avgTime}</div>
            </div>
        `).join('');
    }

    initializeCharts() {
        // Category Distribution Chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx) {
            this.charts.category = new Chart(categoryCtx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: ['Laptop', 'Printer', 'Networking', 'Software', 'Other'],
                    datasets: [{
                        data: [35, 25, 20, 15, 5],
                        backgroundColor: [
                            '#3498db',
                            '#e74c3c',
                            '#2ecc71',
                            '#f39c12',
                            '#9b59b6'
                        ]
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

        // Trend Chart
        const trendCtx = document.getElementById('trendChart');
        if (trendCtx) {
            this.charts.trend = new Chart(trendCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'New Tickets',
                        data: [12, 19, 8, 15, 22, 18, 14],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: true
                    }, {
                        label: 'Resolved',
                        data: [8, 12, 6, 10, 15, 12, 10],
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    updateCategoryChart() {
        const db = Database.getDB();
        const tickets = db.tickets || [];
        
        const categories = {
            laptop: 0,
            printer: 0,
            networking: 0,
            software: 0,
            other: 0
        };

        tickets.forEach(ticket => {
            if (categories[ticket.issueType] !== undefined) {
                categories[ticket.issueType]++;
            } else {
                categories.other++;
            }
        });

        if (this.charts.category) {
            this.charts.category.data.datasets[0].data = Object.values(categories);
            this.charts.category.update();
        }
    }

    // All Tickets Functions
    loadAllTickets() {
        const db = Database.getDB();
        const tickets = db.tickets || [];
        const tableBody = document.getElementById('ticketsTableBody');
        
        if (!tableBody) return;

        if (tickets.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-ticket-alt"></i>
                            <p>No tickets found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = tickets.map(ticket => `
            <tr>
                <td><input type="checkbox" class="ticket-checkbox" value="${ticket.id}"></td>
                <td><strong>${ticket.id}</strong></td>
                <td>
                    <div>${ticket.name}</div>
                    <small>${ticket.mobile}</small>
                </td>
                <td>
                    <span class="category-badge ${ticket.issueType}">
                        <i class="fas fa-${this.getCategoryIcon(ticket.issueType)}"></i>
                        ${ticket.issueType}
                    </span>
                </td>
                <td class="truncate">${ticket.description.substring(0, 60)}...</td>
                <td>
                    <span class="ticket-status status-${ticket.status}">
                        ${ticket.status}
                    </span>
                </td>
                <td>
                    <span class="urgency-badge ${ticket.urgency}">
                        ${ticket.urgency}
                    </span>
                </td>
                <td>${new Date(ticket.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons-small">
                        <button class="btn-action-small view" onclick="adminDashboard.viewTicket('${ticket.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action-small edit" onclick="adminDashboard.editTicket('${ticket.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action-small delete" onclick="adminDashboard.deleteTicket('${ticket.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
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

    searchTickets(query) {
        const searchTerm = query.toLowerCase();
        const rows = document.querySelectorAll('#ticketsTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    // Manage Tickets Functions
    loadManageTickets() {
        this.loadPendingTickets();
        this.loadInProgressTickets();
        this.updateQueueCounts();
    }

    loadPendingTickets() {
        const db = Database.getDB();
        const pendingTickets = (db.tickets || []).filter(t => t.status === 'pending');
        const container = document.getElementById('pendingColumn');
        
        if (!container) return;

        container.innerHTML = pendingTickets.map(ticket => `
            <div class="ticket-card" onclick="adminDashboard.selectTicket('${ticket.id}')">
                <div class="ticket-card-header">
                    <strong>${ticket.id}</strong>
                    <span class="urgency-badge ${ticket.urgency}">${ticket.urgency}</span>
                </div>
                <div class="ticket-card-body">
                    <div><strong>${ticket.name}</strong></div>
                    <div class="ticket-category">${ticket.issueType}</div>
                    <p class="truncate">${ticket.description.substring(0, 80)}...</p>
                </div>
                <div class="ticket-card-footer">
                    <span>${new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <button class="btn-action-small assign" onclick="event.stopPropagation(); adminDashboard.assignTicket('${ticket.id}')">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </div>
            </div>
        `).join('') || '<div class="empty-state">No pending tickets</div>';
    }

    loadInProgressTickets() {
        const db = Database.getDB();
        const progressTickets = (db.tickets || []).filter(t => t.status === 'in-progress');
        const container = document.getElementById('progressColumn');
        
        if (!container) return;

        container.innerHTML = progressTickets.map(ticket => `
            <div class="ticket-card in-progress" onclick="adminDashboard.selectTicket('${ticket.id}')">
                <div class="ticket-card-header">
                    <strong>${ticket.id}</strong>
                    <div class="assigned-to">
                        <i class="fas fa-user"></i> ${ticket.assignedTo || 'Unassigned'}
                    </div>
                </div>
                <div class="ticket-card-body">
                    <div><strong>${ticket.name}</strong></div>
                    <div class="ticket-category">${ticket.issueType}</div>
                    <p class="truncate">${ticket.description.substring(0, 80)}...</p>
                </div>
                <div class="ticket-card-footer">
                    <span>Started: ${new Date(ticket.updatedAt).toLocaleDateString()}</span>
                    <button class="btn-action-small resolve" onclick="event.stopPropagation(); adminDashboard.resolveTicketPrompt('${ticket.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `).join('') || '<div class="empty-state">No tickets in progress</div>';
    }

    updateQueueCounts() {
        const db = Database.getDB();
        const tickets = db.tickets || [];
        
        const pending = tickets.filter(t => t.status === 'pending').length;
        const progress = tickets.filter(t => t.status === 'in-progress').length;
        const assigned = tickets.filter(t => t.assignedTo === this.currentUser.name).length;
        const urgent = tickets.filter(t => t.urgency === 'urgent').length;

        this.updateElement('pendingCount', pending);
        this.updateElement('progressCount', progress);
        this.updateElement('assignedCount', assigned);
        this.updateElement('urgentCount', urgent);
    }

    selectTicket(ticketId) {
        this.currentTicket = ticketId;
        this.showTicketDetails(ticketId);
        
        // Highlight selected ticket
        document.querySelectorAll('.ticket-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`.ticket-card[onclick*="${ticketId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }

    showTicketDetails(ticketId) {
        const db = Database.getDB();
        const ticket = db.tickets.find(t => t.id === ticketId);
        
        if (!ticket) return;

        const container = document.getElementById('ticketDetailsPanel');
        if (!container) return;

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

        container.innerHTML = `
            <div class="ticket-details-full">
                <div class="ticket-header-details">
                    <h3>${ticket.id}</h3>
                    <div class="ticket-meta">
                        <span class="ticket-status status-${ticket.status}">${ticket.status}</span>
                        <span class="urgency-badge ${ticket.urgency}">${ticket.urgency}</span>
                    </div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-section">
                        <h4><i class="fas fa-user"></i> User Information</h4>
                        <div class="detail-row">
                            <span class="label">Name:</span>
                            <span class="value">${ticket.name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Mobile:</span>
                            <span class="value">${ticket.mobile}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Department:</span>
                            <span class="value">${departments[ticket.department] || ticket.department}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Location:</span>
                            <span class="value">${ticket.location || 'Not specified'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="fas fa-info-circle"></i> Ticket Information</h4>
                        <div class="detail-row">
                            <span class="label">Category:</span>
                            <span class="value">${ticket.issueType}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Created:</span>
                            <span class="value">${new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Updated:</span>
                            <span class="value">${new Date(ticket.updatedAt).toLocaleString()}</span>
                        </div>
                        ${ticket.assignedTo ? `
                        <div class="detail-row">
                            <span class="label">Assigned To:</span>
                            <span class="value">${ticket.assignedTo}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-comment"></i> Description</h4>
                    <div class="description-box">
                        ${ticket.description}
                    </div>
                </div>
                
                ${ticket.resolution ? `
                <div class="detail-section">
                    <h4><i class="fas fa-check-circle"></i> Resolution</h4>
                    <div class="resolution-box">
                        ${ticket.resolution}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    assignTicket(ticketId) {
        const technician = prompt('Enter technician name:');
        if (technician) {
            const success = Database.updateTicketStatus(ticketId, 'in-progress', '', technician);
            if (success) {
                showToast(`Ticket assigned to ${technician}`, 'success');
                this.loadManageTickets();
                this.loadAllTickets();
            }
        }
    }

    resolveTicketPrompt(ticketId) {
        const resolution = prompt('Enter resolution details:');
        if (resolution) {
            const success = Database.updateTicketStatus(ticketId, 'resolved', resolution);
            if (success) {
                showToast('Ticket marked as resolved', 'success');
                this.loadManageTickets();
                this.loadAllTickets();
                this.updateQuickStats();
            }
        }
    }

    // Users Functions
    loadUsers() {
        const db = Database.getDB();
        const users = db.users || [];
        const tableBody = document.getElementById('usersTableBody');
        
        if (!tableBody) return;

        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>No users found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = users.map((user, index) => {
            const userTickets = db.tickets?.filter(t => t.mobile === user.mobile) || [];
            const lastActive = new Date(user.lastActive || user.createdAt);
            
            return `
                <tr onclick="adminDashboard.showUserDetails('${user.mobile}')">
                    <td>U${1000 + index}</td>
                    <td>
                        <div class="user-avatar">
                            <i class="fas fa-user-circle"></i>
                            <div>
                                <strong>${user.name || 'Guest User'}</strong>
                                <small>${user.mobile}</small>
                            </div>
                        </div>
                    </td>
                    <td>${user.mobile}</td>
                    <td>${user.department || 'Not specified'}</td>
                    <td>
                        <span class="ticket-count">${userTickets.length} tickets</span>
                    </td>
                    <td>${lastActive.toLocaleDateString()}</td>
                    <td>
                        <span class="status-badge active">Active</span>
                    </td>
                    <td>
                        <button class="btn-action-small" onclick="event.stopPropagation(); adminDashboard.contactUser('${user.mobile}')">
                            <i class="fas fa-phone"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    showUserDetails(mobile) {
        const db = Database.getDB();
        const user = db.users.find(u => u.mobile === mobile);
        const userTickets = db.tickets?.filter(t => t.mobile === mobile) || [];
        
        const container = document.getElementById('userInfoPanel');
        if (!container || !user) return;

        container.innerHTML = `
            <div class="user-details-full">
                <div class="user-header">
                    <div class="user-avatar-large">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-info">
                        <h3>${user.name || 'Guest User'}</h3>
                        <p><i class="fas fa-mobile-alt"></i> ${user.mobile}</p>
                        ${user.email ? `<p><i class="fas fa-envelope"></i> ${user.email}</p>` : ''}
                    </div>
                </div>
                
                <div class="user-stats">
                    <div class="stat-card small">
                        <i class="fas fa-ticket-alt"></i>
                        <div>
                            <h4>${userTickets.length}</h4>
                            <p>Total Tickets</p>
                        </div>
                    </div>
                    <div class="stat-card small">
                        <i class="fas fa-clock"></i>
                        <div>
                            <h4>${userTickets.filter(t => t.status === 'pending').length}</h4>
                            <p>Pending</p>
                        </div>
                    </div>
                    <div class="stat-card small">
                        <i class="fas fa-check-circle"></i>
                        <div>
                            <h4>${userTickets.filter(t => t.status === 'resolved').length}</h4>
                            <p>Resolved</p>
                        </div>
                    </div>
                </div>
                
                <div class="user-tickets">
                    <h4><i class="fas fa-history"></i> Recent Tickets</h4>
                    ${userTickets.length === 0 ? 
                        '<p class="empty-state">No tickets submitted</p>' :
                        userTickets.slice(0, 5).map(ticket => `
                            <div class="user-ticket-item">
                                <div>
                                    <strong>${ticket.id}</strong>
                                    <div class="ticket-status status-${ticket.status}">${ticket.status}</div>
                                </div>
                                <div class="ticket-category">${ticket.issueType}</div>
                                <div class="ticket-date">${new Date(ticket.createdAt).toLocaleDateString()}</div>
                            </div>
                        `).join('')
                    }
                </div>
                
                <div class="user-actions">
                    <button class="btn-action" onclick="adminDashboard.contactUser('${user.mobile}')">
                        <i class="fas fa-phone"></i> Contact User
                    </button>
                    <button class="btn-action" onclick="adminDashboard.viewAllUserTickets('${user.mobile}')">
                        <i class="fas fa-list"></i> View All Tickets
                    </button>
                </div>
            </div>
        `;
    }

    contactUser(mobile) {
        const message = prompt('Enter message to send to user:');
        if (message) {
            showToast(`Message sent to ${mobile}`, 'success');
            // Here you would integrate with SMS/Email API
        }
    }

    // Settings Functions
    loadSettings() {
        this.loadCategories();
        this.loadTechnicians();
        this.loadBackupList();
    }

    showSettingsTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.querySelector(`.settings-tab[data-tab="${tabId}"]`);
        const selectedPanel = document.getElementById(tabId);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (selectedPanel) selectedPanel.classList.add('active');
    }

    loadCategories() {
        const db = Database.getDB();
        const categories = db.settings?.categories || ['laptop', 'printer', 'networking'];
        
        const container = document.getElementById('categoriesList');
        if (!container) return;

        container.innerHTML = categories.map(category => `
            <div class="category-item">
                <div class="category-info">
                    <i class="fas fa-${this.getCategoryIcon(category)}"></i>
                    <span>${category}</span>
                </div>
                <div class="category-actions">
                    <button class="btn-action-small" onclick="adminDashboard.editCategory('${category}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action-small delete" onclick="adminDashboard.deleteCategory('${category}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    addCategory() {
        const newCategory = document.getElementById('newCategory')?.value.trim();
        if (!newCategory) {
            showToast('Please enter category name', 'error');
            return;
        }

        const db = Database.getDB();
        if (!db.settings.categories) {
            db.settings.categories = [];
        }

        if (db.settings.categories.includes(newCategory.toLowerCase())) {
            showToast('Category already exists', 'warning');
            return;
        }

        db.settings.categories.push(newCategory.toLowerCase());
        Database.saveDB(db);
        
        document.getElementById('newCategory').value = '';
        this.loadCategories();
        showToast('Category added successfully', 'success');
    }

    deleteCategory(category) {
        if (!confirm(`Delete category "${category}"? This will not affect existing tickets.`)) {
            return;
        }

        const db = Database.getDB();
        const index = db.settings.categories.indexOf(category);
        if (index > -1) {
            db.settings.categories.splice(index, 1);
            Database.saveDB(db);
            this.loadCategories();
            showToast('Category deleted', 'success');
        }
    }

    loadTechnicians() {
        const db = Database.getDB();
        const technicians = db.settings?.technicians || ['John', 'Sarah', 'Mike', 'Priya'];
        
        const container = document.getElementById('techniciansList');
        if (!container) return;

        container.innerHTML = technicians.map(tech => `
            <div class="technician-item">
                <div class="technician-info">
                    <i class="fas fa-user-tie"></i>
                    <div>
                        <strong>${tech}</strong>
                        <small>IT Support Technician</small>
                    </div>
                </div>
                <div class="technician-stats">
                    <span class="stat">Active: 5 tickets</span>
                    <span class="stat">Resolved: 45</span>
                </div>
                <div class="technician-actions">
                    <button class="btn-action-small" onclick="adminDashboard.editTechnician('${tech}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action-small delete" onclick="adminDashboard.removeTechnician('${tech}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    addTechnician() {
        const name = prompt('Enter technician name:');
        if (name) {
            const db = Database.getDB();
            if (!db.settings.technicians) {
                db.settings.technicians = [];
            }
            
            db.settings.technicians.push(name);
            Database.saveDB(db);
            this.loadTechnicians();
            showToast('Technician added', 'success');
        }
    }

    removeTechnician(technician) {
        if (!confirm(`Remove technician "${technician}"?`)) {
            return;
        }

        const db = Database.getDB();
        const index = db.settings.technicians.indexOf(technician);
        if (index > -1) {
            db.settings.technicians.splice(index, 1);
            Database.saveDB(db);
            this.loadTechnicians();
            showToast('Technician removed', 'success');
        }
    }

    loadBackupList() {
        const container = document.getElementById('backupList');
        if (!container) return;

        const backups = [
            { date: '2024-01-15', size: '45 KB', type: 'Full' },
            { date: '2024-01-10', size: '38 KB', type: 'Partial' },
            { date: '2024-01-05', size: '42 KB', type: 'Full' }
        ];

        container.innerHTML = backups.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <i class="fas fa-database"></i>
                    <div>
                        <strong>Backup ${backup.date}</strong>
                        <small>${backup.type} Backup • ${backup.size}</small>
                    </div>
                </div>
                <button class="btn-action-small" onclick="adminDashboard.restoreBackup('${backup.date}')">
                    <i class="fas fa-undo"></i> Restore
                </button>
            </div>
        `).join('');
    }

    createBackup() {
        const db = Database.getDB();
        const backupData = JSON.stringify(db, null, 2);
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Backup created successfully', 'success');
    }

    // Utility Functions
    viewTicket(ticketId) {
        this.selectTicket(ticketId);
        this.showTicketDetails(ticketId);
    }

    editTicket(ticketId) {
        const resolution = prompt('Enter resolution or update:');
        if (resolution) {
            const success = Database.updateTicketStatus(ticketId, 'in-progress', resolution);
            if (success) {
                showToast('Ticket updated', 'success');
                this.loadAllTickets();
                this.loadManageTickets();
            }
        }
    }

    deleteTicket(ticketId) {
        if (!confirm('Delete this ticket? This action cannot be undone.')) {
            return;
        }

        const success = Database.deleteTicket(ticketId);
        if (success) {
            showToast('Ticket deleted', 'success');
            this.loadAllTickets();
            this.loadManageTickets();
            this.updateQuickStats();
        }
    }

    bulkAssign() {
        const selectedTickets = this.getSelectedTickets();
        if (selectedTickets.length === 0) {
            showToast('No tickets selected', 'warning');
            return;
        }

        const technician = prompt('Assign to technician:');
        if (technician) {
            selectedTickets.forEach(ticketId => {
                Database.updateTicketStatus(ticketId, 'in-progress', '', technician);
            });
            showToast(`Assigned ${selectedTickets.length} tickets to ${technician}`, 'success');
            this.loadAllTickets();
            this.loadManageTickets();
        }
    }

    bulkUpdate() {
        const selectedTickets = this.getSelectedTickets();
        if (selectedTickets.length === 0) {
            showToast('No tickets selected', 'warning');
            return;
        }

        const status = prompt('Enter new status (pending/in-progress/resolved):');
        if (status && ['pending', 'in-progress', 'resolved'].includes(status)) {
            selectedTickets.forEach(ticketId => {
                Database.updateTicketStatus(ticketId, status);
            });
            showToast(`Updated ${selectedTickets.length} tickets to ${status}`, 'success');
            this.loadAllTickets();
            this.loadManageTickets();
            this.updateQuickStats();
        }
    }

    bulkDelete() {
        const selectedTickets = this.getSelectedTickets();
        if (selectedTickets.length === 0) {
            showToast('No tickets selected', 'warning');
            return;
        }

        if (!confirm(`Delete ${selectedTickets.length} tickets? This action cannot be undone.`)) {
            return;
        }

        selectedTickets.forEach(ticketId => {
            Database.deleteTicket(ticketId);
        });

        showToast(`Deleted ${selectedTickets.length} tickets`, 'success');
        this.loadAllTickets();
        this.loadManageTickets();
        this.updateQuickStats();
    }

    getSelectedTickets() {
        const checkboxes = document.querySelectorAll('.ticket-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    exportTable() {
        const db = Database.getDB();
        const tickets = db.tickets || [];
        
        const csvData = [
            ['Ticket ID', 'Name', 'Mobile', 'Department', 'Issue Type', 'Status', 'Urgency', 'Created Date', 'Description'],
            ...tickets.map(t => [
                t.id,
                t.name,
                t.mobile,
                t.department,
                t.issueType,
                t.status,
                t.urgency,
                new Date(t.createdAt).toLocaleDateString(),
                t.description
            ])
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Data exported to CSV', 'success');
    }

    generateReport() {
        const fromDate = document.getElementById('reportFrom')?.value;
        const toDate = document.getElementById('reportTo')?.value;
        const reportType = document.getElementById('reportType')?.value;

        if (!fromDate || !toDate) {
            showToast('Please select date range', 'error');
            return;
        }

        // Generate report based on dates
        showToast(`Report generated for ${fromDate} to ${toDate}`, 'success');
        
        // Update report charts
        this.updateReportCharts();
        this.loadReportTable();
    }

    updateReportCharts() {
        // Update trend chart with filtered data
        if (this.charts.trend) {
            // Simulate filtered data
            this.charts.trend.data.datasets[0].data = [15, 22, 18, 25, 30, 22, 20];
            this.charts.trend.data.datasets[1].data = [12, 18, 14, 20, 25, 18, 16];
            this.charts.trend.update();
        }
    }

    loadReportTable() {
        const tableBody = document.getElementById('reportTableBody');
        if (!tableBody) return;

        const reportData = [
            { date: '2024-01-15', new: 12, resolved: 8, avgTime: '2h 30m', topCat: 'Laptop', tech: 'John' },
            { date: '2024-01-14', new: 15, resolved: 10, avgTime: '3h 15m', topCat: 'Printer', tech: 'Sarah' },
            { date: '2024-01-13', new: 10, resolved: 7, avgTime: '2h 45m', topCat: 'Networking', tech: 'Mike' },
            { date: '2024-01-12', new: 18, resolved: 12, avgTime: '2h 10m', topCat: 'Software', tech: 'Priya' },
            { date: '2024-01-11', new: 14, resolved: 9, avgTime: '3h 00m', topCat: 'Laptop', tech: 'John' }
        ];

        tableBody.innerHTML = reportData.map(row => `
            <tr>
                <td>${row.date}</td>
                <td>${row.new}</td>
                <td>${row.resolved}</td>
                <td>${row.avgTime}</td>
                <td>${row.topCat}</td>
                <td>${row.tech}</td>
            </tr>
        `).join('');
    }

    saveSettings() {
        const systemName = document.getElementById('systemName')?.value;
        const refreshInterval = document.getElementById('refreshInterval')?.value;
        const defaultTech = document.getElementById('defaultTech')?.value;
        const autoCloseDays = document.getElementById('autoCloseDays')?.value;

        const db = Database.getDB();
        db.settings.systemName = systemName || 'Campus IT Support';
        db.settings.autoCloseDays = parseInt(autoCloseDays) || 30;
        
        Database.saveDB(db);
        showToast('Settings saved successfully', 'success');
    }

    saveSecurity() {
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (newPassword && newPassword === confirmPassword) {
            const db = Database.getDB();
            db.admins[0].password = newPassword;
            Database.saveDB(db);
            showToast('Password changed successfully', 'success');
        } else if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
        }
    }

    // Live Updates
    updateLiveStats() {
        this.updateQuickStats();
        this.updateDBStats();
    }

    updateDBStats() {
        const db = Database.getDB();
        const tickets = db.tickets || [];
        const dbSize = JSON.stringify(db).length;
        
        const dbSizeElement = document.getElementById('dbSize');
        const activeUsersElement = document.getElementById('activeUsers');
        
        if (dbSizeElement) {
            dbSizeElement.textContent = `${Math.round(dbSize / 1024)} KB`;
        }
        
        if (activeUsersElement) {
            // Count users active in last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const activeUsers = db.users?.filter(user => 
                new Date(user.lastActive) > yesterday
            ).length || 0;
            
            activeUsersElement.textContent = activeUsers;
        }
    }

    startLiveUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.updateLiveStats();
        }, 30000);
    }

    refreshDashboard() {
        this.loadDashboard();
        this.loadAllTickets();
        this.loadManageTickets();
        this.loadUsers();
        showToast('Dashboard refreshed', 'info');
    }

    // Export All Data
    exportAllData() {
        const db = Database.getDB();
        const dataStr = JSON.stringify(db, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `campus-data-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('All data exported', 'success');
    }
}

// Initialize Admin Dashboard
let adminDashboard;

document.addEventListener('DOMContentLoaded', function() {
    adminDashboard = new AdminDashboard();
});

// Global functions for HTML onclick handlers
function refreshDashboard() {
    if (adminDashboard) adminDashboard.refreshDashboard();
}

function exportAllTickets() {
    if (adminDashboard) adminDashboard.exportTable();
}

function bulkUpdateStatus() {
    if (adminDashboard) adminDashboard.bulkUpdate();
}

function sendBroadcast() {
    const message = prompt('Enter broadcast message for all users:');
    if (message) {
        showToast('Broadcast message sent', 'success');
    }
}

function clearOldTickets() {
    if (!confirm('Clear tickets older than 30 days? This action cannot be undone.')) {
        return;
    }
    showToast('Old tickets cleared', 'success');
}

function backupDatabase() {
    if (adminDashboard) adminDashboard.createBackup();
}

function assignToMe() {
    if (adminDashboard && adminDashboard.currentTicket) {
        const success = Database.updateTicketStatus(adminDashboard.currentTicket, 'in-progress', '', adminDashboard.currentUser.name);
        if (success) {
            showToast('Ticket assigned to you', 'success');
            adminDashboard.loadManageTickets();
        }
    }
}

function startProgress() {
    if (adminDashboard && adminDashboard.currentTicket) {
        const success = Database.updateTicketStatus(adminDashboard.currentTicket, 'in-progress');
        if (success) {
            showToast('Ticket marked as in progress', 'success');
            adminDashboard.loadManageTickets();
        }
    }
}

function markResolved() {
    if (adminDashboard && adminDashboard.currentTicket) {
        adminDashboard.resolveTicketPrompt(adminDashboard.currentTicket);
    }
}

function addNote() {
    if (adminDashboard && adminDashboard.currentTicket) {
        const note = prompt('Add note to ticket:');
        if (note) {
            showToast('Note added', 'success');
        }
    }
}

function escalateTicket() {
    if (adminDashboard && adminDashboard.currentTicket) {
        const reason = prompt('Reason for escalation:');
        if (reason) {
            showToast('Ticket escalated to supervisor', 'success');
        }
    }
}

function assignToTech() {
    const techSelect = document.getElementById('technicianSelect');
    if (techSelect && adminDashboard && adminDashboard.currentTicket) {
        const technician = techSelect.value;
        if (technician) {
            const success = Database.updateTicketStatus(adminDashboard.currentTicket, 'in-progress', '', technician);
            if (success) {
                showToast(`Ticket assigned to ${technician}`, 'success');
                adminDashboard.loadManageTickets();
            }
        }
    }
}

function generateReport() {
    if (adminDashboard) adminDashboard.generateReport();
}

function addNewUser() {
    const mobile = prompt('Enter user mobile number:');
    if (mobile && /^[6-9]\d{9}$/.test(mobile)) {
        Database.addUser(mobile);
        showToast('User added successfully', 'success');
        if (adminDashboard) adminDashboard.loadUsers();
    } else {
        showToast('Invalid mobile number', 'error');
    }
}

function restoreBackup(date) {
    if (confirm(`Restore backup from ${date}? This will replace current data.`)) {
        showToast('Backup restored', 'success');
    }
}

// Add CSS for admin specific styles
const adminStyles = `
/* Admin Specific Styles */
.category-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: var(--light);
    border-radius: 15px;
    font-size: 0.85rem;
    color: var(--dark);
}

.urgency-badge {
    padding: 4px 10px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
}

.urgency-badge.low { background: rgba(46, 204, 113, 0.2); color: var(--success); }
.urgency-badge.medium { background: rgba(243, 156, 18, 0.2); color: var(--warning); }
.urgency-badge.high { background: rgba(231, 76, 60, 0.2); color: var(--danger); }
.urgency-badge.urgent { background: rgba(255, 0, 0, 0.2); color: #ff0000; }

.action-buttons-small {
    display: flex;
    gap: 5px;
}

.btn-action-small {
    width: 35px;
    height: 35px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}

.btn-action-small.view { background: var(--secondary); color: white; }
.btn-action-small.edit { background: var(--warning); color: white; }
.btn-action-small.delete { background: var(--danger); color: white; }
.btn-action-small.assign { background: var(--info); color: white; }
.btn-action-small.resolve { background: var(--success); color: white; }

.btn-action-small:hover {
    opacity: 0.9;
    transform: scale(1.1);
}

.ticket-card {
    background: white;
    border: 2px solid var(--border);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.ticket-card:hover {
    border-color: var(--secondary);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.ticket-card.selected {
    border-color: var(--secondary);
    background: rgba(52, 152, 219, 0.05);
}

.ticket-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.ticket-card-body {
    margin-bottom: 10px;
}

.ticket-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--gray);
}

.assigned-to {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.85rem;
    color: var(--dark);
}

.ticket-details-full {
    max-height: 500px;
    overflow-y: auto;
}

.details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
}

@media (max-width: 768px) {
    .details-grid {
        grid-template-columns: 1fr;
    }
}

.detail-section {
    margin-bottom: 25px;
}

.detail-section h4 {
    margin-bottom: 15px;
    color: var(--dark);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.1rem;
}

.detail-row {
    display: flex;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--border);
}

.detail-row .label {
    min-width: 120px;
    font-weight: 600;
    color: var(--gray);
}

.detail-row .value {
    flex: 1;
    color: var(--dark);
}

.description-box, .resolution-box {
    background: var(--light);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--border);
    line-height: 1.6;
    white-space: pre-line;
}

.user-avatar {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-avatar i {
    font-size: 2rem;
    color: var(--secondary);
}

.ticket-count {
    background: var(--light);
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 0.85rem;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 0.85rem;
    font-weight: 600;
}

.status-badge.active {
    background: rgba(46, 204, 113, 0.2);
    color: var(--success);
}

.user-details-full {
    padding: 20px;
}

.user-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
}

.user-avatar-large i {
    font-size: 4rem;
    color: var(--secondary);
}

.user-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 30px;
}

.stat-card.small {
    padding: 15px;
    flex-direction: column;
    text-align: center;
    gap: 10px;
}

.stat-card.small i {
    width: 50px;
    height: 50px;
}

.stat-card.small h4 {
    font-size: 1.8rem;
    margin: 5px 0;
}

.user-ticket-item {
    padding: 12px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.user-ticket-item:last-child {
    border-bottom: none;
}

.category-item, .technician-item, .backup-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid var(--border);
}

.category-info, .technician-info, .backup-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.category-info i, .technician-info i, .backup-info i {
    font-size: 1.5rem;
    color: var(--secondary);
}

.technician-stats {
    display: flex;
    gap: 15px;
}

.technician-stats .stat {
    background: var(--light);
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 0.85rem;
}

.no-selection {
    text-align: center;
    padding: 60px 20px;
    color: var(--gray);
}

.no-selection i {
    font-size: 4rem;
    margin-bottom: 20px;
    color: var(--border);
}

.no-selection p {
    font-size: 1.2rem;
}

.text-center {
    text-align: center;
}

.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
`;

// Add admin styles to document
const styleElement = document.createElement('style');
styleElement.textContent = adminStyles;
document.head.appendChild(styleElement);