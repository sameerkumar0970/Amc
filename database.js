// Enhanced Database Functions
const Database = {
    // Initialize database with sample data
    init: function() {
        if (!localStorage.getItem('campusDB')) {
            const initialDB = {
                version: '2.0.0',
                users: [
                    {
                        mobile: '9876543210',
                        name: 'Rajesh Kumar',
                        department: 'cse',
                        email: 'rajesh@campus.edu',
                        tickets: ['TICKET-1001', 'TICKET-1005'],
                        createdAt: '2024-01-01T10:00:00Z',
                        lastActive: new Date().toISOString()
                    },
                    {
                        mobile: '8765432109',
                        name: 'Priya Sharma',
                        department: 'it',
                        email: 'priya@campus.edu',
                        tickets: ['TICKET-1002'],
                        createdAt: '2024-01-05T14:30:00Z',
                        lastActive: new Date().toISOString()
                    }
                ],
                tickets: [
                    {
                        id: 'TICKET-1001',
                        name: 'Rajesh Kumar',
                        mobile: '9876543210',
                        rollNumber: 'CS2021001',
                        department: 'cse',
                        email: 'rajesh@campus.edu',
                        location: 'lab1',
                        issueType: 'laptop',
                        description: 'Laptop not booting, shows blue screen error',
                        urgency: 'high',
                        status: 'pending',
                        screenshot: null,
                        assignedTo: null,
                        resolution: null,
                        createdAt: '2024-01-10T09:15:00Z',
                        updatedAt: '2024-01-10T09:15:00Z',
                        resolvedAt: null
                    },
                    {
                        id: 'TICKET-1002',
                        name: 'Priya Sharma',
                        mobile: '8765432109',
                        rollNumber: 'IT2021005',
                        department: 'it',
                        email: 'priya@campus.edu',
                        location: 'library',
                        issueType: 'printer',
                        description: 'Printer not connecting to WiFi network',
                        urgency: 'medium',
                        status: 'in-progress',
                        screenshot: null,
                        assignedTo: 'John',
                        resolution: 'Checking network configuration',
                        createdAt: '2024-01-11T11:30:00Z',
                        updatedAt: '2024-01-11T14:45:00Z',
                        resolvedAt: null
                    },
                    {
                        id: 'TICKET-1003',
                        name: 'Amit Patel',
                        mobile: '7654321098',
                        rollNumber: 'ME2021012',
                        department: 'mech',
                        email: 'amit@campus.edu',
                        location: 'lab2',
                        issueType: 'networking',
                        description: 'No internet connection in Computer Lab 2',
                        urgency: 'urgent',
                        status: 'resolved',
                        screenshot: null,
                        assignedTo: 'Sarah',
                        resolution: 'Router restarted, connection restored',
                        createdAt: '2024-01-09T08:45:00Z',
                        updatedAt: '2024-01-09T16:20:00Z',
                        resolvedAt: '2024-01-09T16:20:00Z'
                    },
                    {
                        id: 'TICKET-1004',
                        name: 'Sneha Reddy',
                        mobile: '6543210987',
                        rollNumber: 'CE2021008',
                        department: 'civil',
                        email: 'sneha@campus.edu',
                        location: 'office',
                        issueType: 'software',
                        description: 'AutoCAD software not opening',
                        urgency: 'high',
                        status: 'pending',
                        screenshot: null,
                        assignedTo: null,
                        resolution: null,
                        createdAt: '2024-01-12T13:20:00Z',
                        updatedAt: '2024-01-12T13:20:00Z',
                        resolvedAt: null
                    },
                    {
                        id: 'TICKET-1005',
                        name: 'Rajesh Kumar',
                        mobile: '9876543210',
                        rollNumber: 'CS2021001',
                        department: 'cse',
                        email: 'rajesh@campus.edu',
                        location: 'lab1',
                        issueType: 'software',
                        description: 'Microsoft Office activation error',
                        urgency: 'medium',
                        status: 'resolved',
                        screenshot: null,
                        assignedTo: 'Mike',
                        resolution: 'Re-activated with new license key',
                        createdAt: '2024-01-08T10:45:00Z',
                        updatedAt: '2024-01-08T15:30:00Z',
                        resolvedAt: '2024-01-08T15:30:00Z'
                    }
                ],
                admins: [
                    {
                        username: 'admin',
                        password: 'admin123',
                        name: 'System Administrator',
                        role: 'superadmin',
                        lastLogin: new Date().toISOString()
                    },
                    {
                        username: 'tech',
                        password: 'tech123',
                        name: 'Technical Support',
                        role: 'technician',
                        lastLogin: null
                    }
                ],
                settings: {
                    systemName: 'Campus IT Support System',
                    categories: ['laptop', 'printer', 'networking', 'software', 'hardware', 'other'],
                    technicians: ['John', 'Sarah', 'Mike', 'Priya', 'David'],
                    departments: ['cse', 'it', 'ece', 'mech', 'civil', 'science', 'management', 'admin'],
                    locations: ['lab1', 'lab2', 'library', 'hostel', 'office', 'admin_block'],
                    autoCloseDays: 30,
                    notificationSettings: {
                        email: true,
                        sms: false,
                        urgentAlerts: true,
                        dailyReports: true
                    }
                },
                statistics: {
                    totalTickets: 5,
                    pendingTickets: 2,
                    inProgressTickets: 1,
                    resolvedTickets: 2,
                    averageResolutionTime: '4.5 hours',
                    lastUpdated: new Date().toISOString()
                }
            };
            localStorage.setItem('campusDB', JSON.stringify(initialDB));
        }
        return this.getDB();
    },

    // Get entire database
    getDB: function() {
        const db = localStorage.getItem('campusDB');
        return db ? JSON.parse(db) : null;
    },

    // Save entire database
    saveDB: function(db) {
        // Update statistics before saving
        this.updateStatistics(db);
        localStorage.setItem('campusDB', JSON.stringify(db));
    },

    // Update statistics
    updateStatistics: function(db) {
        if (!db.tickets) return;

        const tickets = db.tickets;
        db.statistics = {
            totalTickets: tickets.length,
            pendingTickets: tickets.filter(t => t.status === 'pending').length,
            inProgressTickets: tickets.filter(t => t.status === 'in-progress').length,
            resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
            averageResolutionTime: this.calculateAvgResolutionTime(tickets),
            lastUpdated: new Date().toISOString()
        };
    },

    // Calculate average resolution time
    calculateAvgResolutionTime: function(tickets) {
        const resolvedTickets = tickets.filter(t => t.resolvedAt && t.createdAt);
        if (resolvedTickets.length === 0) return 'N/A';

        const totalHours = resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.createdAt);
            const resolved = new Date(ticket.resolvedAt);
            const hours = (resolved - created) / (1000 * 60 * 60);
            return sum + hours;
        }, 0);

        const avgHours = totalHours / resolvedTickets.length;
        
        if (avgHours < 1) {
            return `${Math.round(avgHours * 60)} minutes`;
        } else if (avgHours < 24) {
            return `${avgHours.toFixed(1)} hours`;
        } else {
            return `${(avgHours / 24).toFixed(1)} days`;
        }
    },

    // Add new user or update existing
    addUser: function(mobile, name = '', department = '', email = '') {
        const db = this.getDB();
        if (!db.users) db.users = [];

        let user = db.users.find(u => u.mobile === mobile);
        
        if (!user) {
            user = {
                mobile: mobile,
                name: name,
                department: department,
                email: email,
                tickets: [],
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            db.users.push(user);
        } else {
            // Update existing user
            if (name) user.name = name;
            if (department) user.department = department;
            if (email) user.email = email;
            user.lastActive = new Date().toISOString();
        }

        this.saveDB(db);
        return user;
    },

    // Add new ticket
    addTicket: function(ticketData) {
        const db = this.getDB();
        if (!db.tickets) db.tickets = [];

        // Generate ticket ID
        const ticketId = 'TICKET-' + (db.tickets.length + 1001);
        
        const ticket = {
            id: ticketId,
            ...ticketData,
            status: 'pending',
            assignedTo: null,
            resolution: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resolvedAt: null
        };

        db.tickets.unshift(ticket); // Add to beginning

        // Update user's ticket list
        const user = db.users?.find(u => u.mobile === ticketData.mobile);
        if (user) {
            if (!user.tickets) user.tickets = [];
            user.tickets.push(ticketId);
            user.lastActive = new Date().toISOString();
        }

        this.saveDB(db);
        return ticket;
    },

    // Get user tickets
    getUserTickets: function(mobile) {
        const db = this.getDB();
        return db.tickets?.filter(t => t.mobile === mobile) || [];
    },

    // Get all tickets
    getAllTickets: function() {
        const db = this.getDB();
        return db.tickets || [];
    },

    // Get ticket by ID
    getTicket: function(ticketId) {
        const db = this.getDB();
        return db.tickets?.find(t => t.id === ticketId);
    },

    // Update ticket status
    updateTicketStatus: function(ticketId, status, resolution = '', assignedTo = '') {
        const db = this.getDB();
        const ticket = db.tickets?.find(t => t.id === ticketId);
        
        if (!ticket) return false;

        ticket.status = status;
        ticket.updatedAt = new Date().toISOString();
        
        if (resolution) ticket.resolution = resolution;
        if (assignedTo) ticket.assignedTo = assignedTo;
        
        if (status === 'resolved' && !ticket.resolvedAt) {
            ticket.resolvedAt = new Date().toISOString();
        }

        this.saveDB(db);
        return true;
    },

    // Delete ticket
    deleteTicket: function(ticketId) {
        const db = this.getDB();
        if (!db.tickets) return false;

        const index = db.tickets.findIndex(t => t.id === ticketId);
        if (index === -1) return false;

        // Remove from user's ticket list
        const ticket = db.tickets[index];
        const user = db.users?.find(u => u.mobile === ticket.mobile);
        if (user && user.tickets) {
            const userTicketIndex = user.tickets.indexOf(ticketId);
            if (userTicketIndex > -1) {
                user.tickets.splice(userTicketIndex, 1);
            }
        }

        db.tickets.splice(index, 1);
        this.saveDB(db);
        return true;
    },

    // Admin login
    adminLogin: function(username, password) {
        const db = this.getDB();
        const admin = db.admins?.find(a => a.username === username && a.password === password);
        
        if (admin) {
            admin.lastLogin = new Date().toISOString();
            this.saveDB(db);
        }
        
        return admin || null;
    },

    // Get statistics
    getStatistics: function() {
        const db = this.getDB();
        return db.statistics || {};
    },

    // Search tickets
    searchTickets: function(query, filters = {}) {
        const db = this.getDB();
        let tickets = db.tickets || [];

        // Apply text search
        if (query) {
            const searchTerm = query.toLowerCase();
            tickets = tickets.filter(ticket =>
                ticket.id.toLowerCase().includes(searchTerm) ||
                ticket.name.toLowerCase().includes(searchTerm) ||
                ticket.mobile.includes(searchTerm) ||
                ticket.description.toLowerCase().includes(searchTerm)
            );
        }

        // Apply filters
        if (filters.status && filters.status !== 'all') {
            tickets = tickets.filter(t => t.status === filters.status);
        }
        
        if (filters.category && filters.category !== 'all') {
            tickets = tickets.filter(t => t.issueType === filters.category);
        }
        
        if (filters.urgency && filters.urgency !== 'all') {
            tickets = tickets.filter(t => t.urgency === filters.urgency);
        }
        
        if (filters.dateFrom && filters.dateTo) {
            const fromDate = new Date(filters.dateFrom);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            
            tickets = tickets.filter(t => {
                const ticketDate = new Date(t.createdAt);
                return ticketDate >= fromDate && ticketDate <= toDate;
            });
        }

        return tickets;
    },

    // Get department-wise statistics
    getDepartmentStats: function() {
        const db = this.getDB();
        const tickets = db.tickets || [];
        
        const stats = {};
        tickets.forEach(ticket => {
            const dept = ticket.department;
            if (!stats[dept]) {
                stats[dept] = { total: 0, pending: 0, resolved: 0 };
            }
            
            stats[dept].total++;
            if (ticket.status === 'pending') stats[dept].pending++;
            if (ticket.status === 'resolved') stats[dept].resolved++;
        });
        
        return stats;
    },

    // Get category-wise statistics
    getCategoryStats: function() {
        const db = this.getDB();
        const tickets = db.tickets || [];
        
        const stats = {};
        tickets.forEach(ticket => {
            const category = ticket.issueType;
            if (!stats[category]) {
                stats[category] = { total: 0, pending: 0, resolved: 0 };
            }
            
            stats[category].total++;
            if (ticket.status === 'pending') stats[category].pending++;
            if (ticket.status === 'resolved') stats[category].resolved++;
        });
        
        return stats;
    },

    // Get daily ticket trends
    getDailyTrends: function(days = 7) {
        const db = this.getDB();
        const tickets = db.tickets || [];
        
        const trends = {};
        const today = new Date();
        
        // Initialize last 'days' days
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            trends[dateStr] = { new: 0, resolved: 0 };
        }
        
        // Count tickets per day
        tickets.forEach(ticket => {
            const createdDate = new Date(ticket.createdAt).toISOString().split('T')[0];
            if (trends[createdDate]) {
                trends[createdDate].new++;
            }
            
            if (ticket.resolvedAt) {
                const resolvedDate = new Date(ticket.resolvedAt).toISOString().split('T')[0];
                if (trends[resolvedDate]) {
                    trends[resolvedDate].resolved++;
                }
            }
        });
        
        return trends;
    },

    // Backup database
    backupDatabase: function() {
        const db = this.getDB();
        const backup = {
            timestamp: new Date().toISOString(),
            data: db,
            version: '2.0.0'
        };
        
        const backups = JSON.parse(localStorage.getItem('campusBackups') || '[]');
        backups.push(backup);
        
        // Keep only last 5 backups
        if (backups.length > 5) {
            backups.shift();
        }
        
        localStorage.setItem('campusBackups', JSON.stringify(backups));
        return backup;
    },

    // Restore from backup
    restoreBackup: function(timestamp) {
        const backups = JSON.parse(localStorage.getItem('campusBackups') || '[]');
        const backup = backups.find(b => b.timestamp === timestamp);
        
        if (backup) {
            localStorage.setItem('campusDB', JSON.stringify(backup.data));
            return true;
        }
        
        return false;
    },

    // Export data as CSV
    exportAsCSV: function(dataType = 'tickets') {
        const db = this.getDB();
        let data = [];
        let headers = [];
        
        switch (dataType) {
            case 'tickets':
                data = db.tickets || [];
                headers = ['ID', 'Name', 'Mobile', 'Department', 'Issue Type', 'Description', 'Urgency', 'Status', 'Created At', 'Resolved At', 'Resolution'];
                break;
            case 'users':
                data = db.users || [];
                headers = ['Mobile', 'Name', 'Department', 'Email', 'Tickets Count', 'Created At', 'Last Active'];
                break;
        }
        
        const csvRows = [];
        
        // Add headers
        csvRows.push(headers.join(','));
        
        // Add data rows
        data.forEach(item => {
            const row = headers.map(header => {
                let value = item[header.toLowerCase().replace(' ', '')] || '';
                
                // Format special fields
                switch (header) {
                    case 'Created At':
                    case 'Resolved At':
                    case 'Last Active':
                        if (value) {
                            value = new Date(value).toLocaleString();
                        }
                        break;
                    case 'Tickets Count':
                        value = item.tickets?.length || 0;
                        break;
                }
                
                // Escape commas and quotes
                value = String(value).replace(/"/g, '""');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value}"`;
                }
                
                return value;
            });
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }
};

// Initialize database on load
document.addEventListener('DOMContentLoaded', function() {
    Database.init();
});