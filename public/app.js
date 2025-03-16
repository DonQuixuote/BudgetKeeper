// Local Storage Management
const STORAGE_KEY = 'budgetKeeperProfiles';
const ACTIVE_PROFILE_KEY = 'budgetKeeperActiveProfile';

const loadProfiles = () => {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const activeProfile = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return { profiles, activeProfile };
};

const saveProfiles = (profiles, activeProfile = null) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    if (activeProfile) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfile);
    }
};

// State management
let currentStep = 1;
const totalSteps = 4;
let userData = {
    name: '',
    income: {
        amount: 0,
        frequency: 'monthly',
        paydays: [] // Array of dates in the month when paychecks are received
    },
    savingsGoal: 20,
    expenses: {
        savings: [],
        housing: [],
        debt: [],
        subscription: [],
        essential: []
    },
    reminderDays: 3
};

// Profile Management
const loadUserData = (profileName) => {
    const { profiles } = loadProfiles();
    if (profiles[profileName]) {
        userData = profiles[profileName];
        return true;
    }
    return false;
};

const saveUserData = (newName = null) => {
    const { profiles } = loadProfiles();
    const oldName = userData.name;
    
    // If renaming the profile
    if (newName && newName !== oldName) {
        // Delete old profile entry
        delete profiles[oldName];
        // Update user data with new name
        userData.name = newName;
    }
    
    profiles[userData.name] = userData;
    saveProfiles(profiles, userData.name);
    updateProfileList();
};

const deleteProfile = (profileName) => {
    const { profiles, activeProfile } = loadProfiles();
    delete profiles[profileName];
    saveProfiles(profiles, activeProfile === profileName ? null : activeProfile);
    updateProfileList();
};

const renameProfile = (oldName) => {
    const newName = prompt('Enter new profile name:', oldName);
    if (newName && newName.trim() && newName !== oldName) {
        if (loadUserData(oldName)) {
            saveUserData(newName);
            document.getElementById('user-name').value = newName;
        }
    }
};

// Export/Import functions
const exportProfile = (profileName) => {
    const { profiles } = loadProfiles();
    const profile = profiles[profileName];
    
    if (profile) {
        const dataStr = JSON.stringify(profile, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${profileName.replace(/\s+/g, '_')}_budget.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

const exportAllProfiles = () => {
    const { profiles } = loadProfiles();
    const dataStr = JSON.stringify(profiles, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'budget_profiles.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const importProfiles = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Check if it's a single profile or multiple profiles
                if (importedData.name) {
                    // Single profile
                    const { profiles } = loadProfiles();
                    profiles[importedData.name] = importedData;
                    saveProfiles(profiles);
                } else {
                    // Multiple profiles
                    saveProfiles(importedData);
                }
                
                updateProfileList();
                resolve();
            } catch (error) {
                reject('Invalid profile data format');
            }
        };
        
        reader.onerror = () => reject('Error reading file');
        reader.readAsText(file);
    });
};

// Update profile selection in the UI
const updateProfileList = () => {
    const { profiles, activeProfile } = loadProfiles();
    const profileSelect = document.getElementById('profile-select');
    const profileList = document.getElementById('profile-list');
    
    // Update profile selector
    profileSelect.innerHTML = '<option value="">Create New Profile</option>' +
        Object.keys(profiles).map(name => 
            `<option value="${name}" ${name === activeProfile ? 'selected' : ''}>${name}</option>`
        ).join('');
    
    // Add export/import controls
    const exportImportControls = `
        <div class="export-import-controls">
            <input type="file" id="import-file" accept=".json" style="display: none;">
            <button class="btn btn-primary" id="export-all">Export All Profiles</button>
            <button class="btn btn-primary" id="import-profiles">Import Profiles</button>
        </div>
    `;
    
    // Update profile list
    profileList.innerHTML = exportImportControls + 
        Object.keys(profiles).map(name => `
            <div class="profile-item">
                <span>${name}</span>
                <div class="profile-actions">
                    <button class="btn btn-secondary rename-profile" data-profile="${name}">Rename</button>
                    <button class="btn btn-primary edit-profile" data-profile="${name}">Edit</button>
                    <button class="btn btn-primary export-profile" data-profile="${name}">Export</button>
                    <button class="btn btn-danger delete-profile" data-profile="${name}">Delete</button>
                </div>
            </div>
        `).join('');
    
    // Add export all handler
    document.getElementById('export-all').addEventListener('click', exportAllProfiles);
    
    // Add import handler
    const importFile = document.getElementById('import-file');
    document.getElementById('import-profiles').addEventListener('click', () => {
        importFile.click();
    });
    
    importFile.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            try {
                await importProfiles(e.target.files[0]);
                alert('Profiles imported successfully!');
            } catch (error) {
                alert(error);
            }
            e.target.value = ''; // Reset file input
        }
    });
    
    // Add rename button handlers
    document.querySelectorAll('.rename-profile').forEach(button => {
        button.addEventListener('click', (e) => {
            const profileName = e.target.dataset.profile;
            renameProfile(profileName);
        });
    });

    // Add delete button handlers
    document.querySelectorAll('.delete-profile').forEach(button => {
        button.addEventListener('click', (e) => {
            const profileName = e.target.dataset.profile;
            if (confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
                deleteProfile(profileName);
            }
        });
    });

    // Add edit button handlers
    document.querySelectorAll('.edit-profile').forEach(button => {
        button.addEventListener('click', (e) => {
            const profileName = e.target.dataset.profile;
            editProfile(profileName);
        });
    });
    
    // Add export button handlers
    document.querySelectorAll('.export-profile').forEach(button => {
        button.addEventListener('click', (e) => {
            const profileName = e.target.dataset.profile;
            exportProfile(profileName);
        });
    });
};

// Edit profile function
const editProfile = (profileName) => {
    if (loadUserData(profileName)) {
        // Set the profile name in the form
        document.getElementById('user-name').value = userData.name;
        document.getElementById('user-name').readOnly = true;
        
        // Set income and savings data
        document.getElementById('income-amount').value = userData.income.amount;
        document.getElementById('income-frequency').value = userData.income.frequency;
        document.getElementById('income-paydays').value = (userData.income.paydays || []).join(',');
        document.getElementById('savings-goal').value = userData.savingsGoal;
        
        // Clear existing expense entries
        ['savings', 'housing', 'debt', 'subscription', 'essential'].forEach(category => {
            const container = document.getElementById(`${category}-expenses`);
            container.innerHTML = ''; // Clear existing entries
            
            // Add saved expenses
            if (userData.expenses[category]) {
                userData.expenses[category].forEach(expense => {
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'expense-entry';
                    
                    if (category === 'savings') {
                        entryDiv.innerHTML = `
                            <div class="expense-entry-fields">
                                <div class="form-group">
                                    <label>Description</label>
                                    <input type="text" class="expense-label" value="${expense.label}" required>
                                </div>
                                <div class="form-group">
                                    <label>Amount</label>
                                    <input type="number" class="expense-amount" min="0" step="0.01" value="${expense.amount}" required>
                                </div>
                                <div class="form-group">
                                    <label>Goal Amount</label>
                                    <input type="number" class="savings-goal-amount" min="0" step="0.01" placeholder="Optional">
                                    <span class="help-text">Set a target amount for this savings goal</span>
                                </div>
                                <div class="form-group">
                                    <label>Due Date</label>
                                    <input type="date" class="expense-due-date" value="${expense.dueDate}" required>
                                </div>
                                <div class="form-group checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" class="expense-recurring" ${expense.recurring ? 'checked' : ''}>
                                        <span>Recurring monthly</span>
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>Annual Yield (%)</label>
                                    <input type="number" class="savings-yield" min="0" max="100" step="0.01" value="${expense.yield || 0}">
                                </div>
                            </div>
                            <button type="button" class="btn btn-danger remove-expense">Remove</button>
                        `;
                    } else {
                        entryDiv.innerHTML = `
                            <div class="expense-entry-fields">
                                <div class="form-group">
                                    <label>Description</label>
                                    <input type="text" class="expense-label" value="${expense.label}" required>
                                </div>
                                <div class="form-group">
                                    <label>Amount</label>
                                    <input type="number" class="expense-amount" min="0" step="0.01" value="${expense.amount}" required>
                                </div>
                                <div class="form-group outstanding-amount-group" style="display: ${expense.outstanding ? 'block' : 'none'}">
                                    <label>Outstanding Amount</label>
                                    <input type="number" class="expense-outstanding-amount" min="0" step="0.01" value="${expense.outstandingAmount || expense.amount}">
                                </div>
                                <div class="form-group">
                                    <label>Due Date</label>
                                    <input type="date" class="expense-due-date" value="${expense.dueDate}" required>
                                </div>
                                <div class="form-group checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" class="expense-recurring" ${expense.recurring ? 'checked' : ''}>
                                        <span>Recurring monthly</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" class="expense-one-time" ${expense.oneTime ? 'checked' : ''}>
                                        <span>One-time payment</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" class="expense-outstanding" ${expense.outstanding ? 'checked' : ''}>
                                        <span>Outstanding</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" class="expense-split-payment" ${expense.splitPayment ? 'checked' : ''}>
                                        <span>Split across paychecks</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" class="expense-split-with-others" ${expense.splitWithOthers ? 'checked' : ''}>
                                        <span>Split with others</span>
                                    </label>
                                </div>
                                <div class="split-with-others" style="display: ${expense.splitWithOthers ? 'block' : 'none'}">
                                    <div class="split-partner">
                                        <label>Split with (name)</label>
                                        <input type="text" class="split-partner-name" placeholder="Enter name" value="${expense.splitDetails ? expense.splitDetails.partnerName : ''}">
                                    </div>
                                    <div class="split-details">
                                        <div class="split-ratio">
                                            <label>Your share</label>
                                            <input type="number" class="split-ratio-self" min="0" max="100" value="${expense.splitDetails ? expense.splitDetails.selfRatio : 50}">
                                            <span>%</span>
                                        </div>
                                        <div class="split-ratio">
                                            <label>Their share</label>
                                            <input type="number" class="split-ratio-other" min="0" max="100" value="${expense.splitDetails ? expense.splitDetails.otherRatio : 50}">
                                            <span>%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn btn-danger remove-expense">Remove</button>
                        `;
                    }
                    
                    container.appendChild(entryDiv);
                    
                    // Add remove button handler
                    entryDiv.querySelector('.remove-expense').addEventListener('click', () => {
                        entryDiv.remove();
                    });

                    // Add handlers for non-savings expenses
                    if (category !== 'savings') {
                        const outstandingCheckbox = entryDiv.querySelector('.expense-outstanding');
                        const outstandingAmountGroup = entryDiv.querySelector('.outstanding-amount-group');
                        const expenseAmount = entryDiv.querySelector('.expense-amount');
                        const recurringCheckbox = entryDiv.querySelector('.expense-recurring');
                        const oneTimeCheckbox = entryDiv.querySelector('.expense-one-time');
                        const splitWithOthersCheckbox = entryDiv.querySelector('.expense-split-with-others');
                        const splitWithOthersSection = entryDiv.querySelector('.split-with-others');
                        const splitRatioSelf = entryDiv.querySelector('.split-ratio-self');
                        const splitRatioOther = entryDiv.querySelector('.split-ratio-other');
                        
                        // Set up the outstanding checkbox handler
                        outstandingCheckbox.addEventListener('change', (e) => {
                            outstandingAmountGroup.style.display = e.target.checked ? 'block' : 'none';
                            if (e.target.checked) {
                                const outstandingInput = outstandingAmountGroup.querySelector('.expense-outstanding-amount');
                                outstandingInput.value = expenseAmount.value;
                            }
                        });

                        // Update outstanding amount when expense amount changes
                        expenseAmount.addEventListener('change', (e) => {
                            if (outstandingCheckbox.checked) {
                                const outstandingInput = outstandingAmountGroup.querySelector('.expense-outstanding-amount');
                                outstandingInput.value = e.target.value;
                            }
                        });

                        // Handle one-time and recurring checkbox interaction
                        oneTimeCheckbox.addEventListener('change', (e) => {
                            if (e.target.checked) {
                                recurringCheckbox.checked = false;
                            }
                        });

                        recurringCheckbox.addEventListener('change', (e) => {
                            if (e.target.checked) {
                                oneTimeCheckbox.checked = false;
                            }
                        });

                        // Handle split with others checkbox
                        splitWithOthersCheckbox.addEventListener('change', (e) => {
                            splitWithOthersSection.style.display = e.target.checked ? 'block' : 'none';
                        });

                        // Handle split ratio synchronization
                        splitRatioSelf.addEventListener('input', (e) => {
                            const selfValue = parseFloat(e.target.value) || 0;
                            splitRatioOther.value = Math.max(0, Math.min(100, 100 - selfValue));
                        });

                        splitRatioOther.addEventListener('input', (e) => {
                            const otherValue = parseFloat(e.target.value) || 0;
                            splitRatioSelf.value = Math.max(0, Math.min(100, 100 - otherValue));
                        });
                    }
                });
            }
        });
        
        // Go to income section for editing
        currentStep = 2;
        updateSteps(currentStep);
        updateSections(currentStep);
    }
};

// Budget calculation functions
const normalizeAmountToMonthly = (amount, frequency) => {
    switch (frequency) {
        case 'weekly':
            return amount * 52 / 12; // Weekly to monthly
        case 'biweekly':
            return amount * 26 / 12; // Biweekly to monthly
        case 'monthly':
            return amount;
        default:
            return amount;
    }
};

// Add function to determine which paycheck an expense belongs to
const getPaycheckForExpense = (expense, paydays) => {
    if (!expense.dueDate || !paydays || !Array.isArray(paydays) || paydays.length === 0) return 0;
    
    const dueDate = new Date(expense.dueDate);
    const dueDayOfMonth = dueDate.getDate();
    
    // Sort paydays in ascending order
    const sortedPaydays = [...paydays].sort((a, b) => a - b);
    
    // If it's a split payment, return -1 to indicate it should be split across paychecks
    if (expense.splitPayment) return -1;
    
    // Find the last payday that comes before the due date
    for (let i = sortedPaydays.length - 1; i >= 0; i--) {
        if (sortedPaydays[i] < dueDayOfMonth) {
            return sortedPaydays[i];
        }
    }
    
    // If due date is before first payday, assign to the last payday of previous month
    return sortedPaydays[sortedPaydays.length - 1];
};

// Modify calculateBudget to handle per-paycheck calculations
const calculateBudget = (specificPayday = null) => {
    const monthlyIncome = normalizeAmountToMonthly(userData.income.amount, userData.income.frequency);
    const paydays = userData.income.paydays || [];
    const paycheckAmount = monthlyIncome / (paydays.length || 1);
    const targetSavings = (monthlyIncome * userData.savingsGoal) / 100;
    
    // Initialize category totals for each paycheck
    const categoryTotals = {
        savings: { regular: 0, outstanding: 0, byPaycheck: {} },
        housing: { regular: 0, outstanding: 0, byPaycheck: {} },
        debt: { regular: 0, outstanding: 0, byPaycheck: {} },
        subscription: { regular: 0, outstanding: 0, byPaycheck: {} },
        essential: { regular: 0, outstanding: 0, byPaycheck: {} }
    };
    
    // Initialize paycheck totals
    paydays.forEach(payday => {
        Object.keys(categoryTotals).forEach(category => {
            categoryTotals[category].byPaycheck[payday] = {
                regular: 0,
                outstanding: 0
            };
        });
    });
    
    // Calculate totals for each category
    Object.entries(userData.expenses).forEach(([category, expenses]) => {
        expenses.forEach(expense => {
            const paycheckDay = getPaycheckForExpense(expense, paydays);
            const amount = expense.amount;
            
            if (expense.splitPayment) {
                // Split the amount across paychecks
                const splitAmount = amount / paydays.length;
                paydays.forEach(payday => {
                    if (category === 'savings') {
                        categoryTotals[category].byPaycheck[payday].regular += splitAmount;
                    } else if (expense.outstanding) {
                        categoryTotals[category].byPaycheck[payday].outstanding += 
                            (expense.outstandingAmount || amount) / paydays.length;
                    } else {
                        categoryTotals[category].byPaycheck[payday].regular += splitAmount;
                    }
                });
            } else if (paycheckDay) {
                // Assign to specific paycheck
                if (category === 'savings') {
                    categoryTotals[category].byPaycheck[paycheckDay].regular += amount;
                } else if (expense.outstanding) {
                    categoryTotals[category].byPaycheck[paycheckDay].outstanding += 
                        (expense.outstandingAmount || amount);
                } else {
                    categoryTotals[category].byPaycheck[paycheckDay].regular += amount;
                }
            }
            
            // Update total category amounts
            if (category === 'savings') {
                categoryTotals[category].regular += amount;
            } else if (expense.outstanding) {
                categoryTotals[category].outstanding += (expense.outstandingAmount || amount);
            } else {
                categoryTotals[category].regular += amount;
            }
        });
    });
    
    // Calculate totals
    const totalRegularExpenses = Object.values(categoryTotals)
        .reduce((sum, category) => sum + category.regular, 0);
    
    const totalOutstanding = Object.values(categoryTotals)
        .reduce((sum, category) => sum + category.outstanding, 0);
    
    const currentBudget = monthlyIncome - totalRegularExpenses;
    const budgetAfterOutstanding = currentBudget - totalOutstanding;
    
    // Calculate per-paycheck totals
    const paycheckTotals = {};
    paydays.forEach(payday => {
        const regularExpenses = Object.values(categoryTotals)
            .reduce((sum, category) => sum + category.byPaycheck[payday].regular, 0);
        const outstandingExpenses = Object.values(categoryTotals)
            .reduce((sum, category) => sum + category.byPaycheck[payday].outstanding, 0);
            
        paycheckTotals[payday] = {
            income: paycheckAmount,
            regularExpenses,
            outstandingExpenses,
            remaining: paycheckAmount - regularExpenses - outstandingExpenses
        };
    });

    return {
        monthlyIncome,
        paycheckAmount,
        targetSavings,
        totalExpenses: totalRegularExpenses,
        remainingBudget: currentBudget,
        totalOutstanding,
        budgetAfterOutstanding,
        categories: categoryTotals,
        paycheckTotals
    };
};

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

// Format date for display
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// DOM Elements
const profileForm = document.getElementById('profile-form');
const incomeForm = document.getElementById('income-form');
const expensesForm = document.getElementById('expenses-form');
const steps = document.querySelectorAll('.step');
const sections = document.querySelectorAll('.form-section');

// Profile selection handler
document.getElementById('profile-select').addEventListener('change', (e) => {
    const selectedProfile = e.target.value;
    if (selectedProfile) {
        if (loadUserData(selectedProfile)) {
            document.getElementById('user-name').value = userData.name;
            document.getElementById('user-name').readOnly = true;
        }
    } else {
        // Reset for new profile
        userData = {
            name: '',
            income: { amount: 0, frequency: 'monthly' },
            savingsGoal: 20,
            expenses: {
                savings: [],
                housing: [],
                debt: [],
                subscription: [],
                essential: []
            },
            reminderDays: 3
        };
        document.getElementById('user-name').value = '';
        document.getElementById('user-name').readOnly = false;
    }
});

// Update steps indicator
const updateSteps = (step) => {
    steps.forEach((s, index) => {
        if (index + 1 === step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
};

// Update visible section
const updateSections = (step) => {
    sections.forEach(section => section.classList.remove('active'));
    
    // Map step numbers to section IDs
    const sectionIds = {
        1: 'profile-section',
        2: 'income-section',
        3: 'expenses-section',
        4: 'summary-section'
    };
    
    const sectionToShow = document.getElementById(sectionIds[step]);
    if (sectionToShow) {
        sectionToShow.classList.add('active');
    }
};

// Check if notification permission is granted
const checkNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Send notification for upcoming expenses
const sendNotification = (expense) => {
    if (Notification.permission === 'granted') {
        new Notification('Upcoming Expense Reminder', {
            body: `${expense.label} ($${expense.amount}) is due on ${formatDate(expense.dueDate)}`,
            icon: '/favicon.ico'
        });
    }
};

// Check for upcoming expenses and send notifications
const checkUpcomingExpenses = () => {
    const today = new Date();
    const allExpenses = Object.values(userData.expenses)
        .flat()
        .filter(expense => expense.dueDate);

    allExpenses.forEach(expense => {
        const dueDate = new Date(expense.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue === userData.reminderDays) {
            // For recurring expenses, just send the regular reminder
            if (expense.recurring) {
                sendNotification(expense);
            } else {
                // For non-recurring expenses, remind to update the due date
                sendNotification({
                    ...expense,
                    label: `${expense.label} (Update due date)`,
                });
            }
        }
    });
};

// Update upcoming expenses list
const updateUpcomingExpenses = () => {
    const upcomingList = document.getElementById('upcoming-expenses-list');
    const today = new Date();
    
    // Get all expenses and sort by due date
    const allExpenses = Object.values(userData.expenses)
        .flat()
        .filter(expense => expense.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Filter to show only upcoming expenses (next 30 days)
    const upcomingExpenses = allExpenses.filter(expense => {
        const dueDate = new Date(expense.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 30;
    });

    // Update the UI
    upcomingList.innerHTML = upcomingExpenses.length ? 
        upcomingExpenses.map(expense => `
            <div class="upcoming-expense-item">
                <div class="expense-info">
                    <span class="expense-name">${expense.label}</span>
                    <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                </div>
                <div class="due-info">
                    <div class="due-date">Due: ${formatDate(expense.dueDate)}</div>
                    ${expense.recurring ? '<div class="recurring-badge">Recurring</div>' : ''}
                </div>
            </div>
        `).join('') :
        '<p>No upcoming expenses in the next 30 days</p>';
};

// Add new expense entry
const addExpenseEntry = (category) => {
    const container = document.getElementById(`${category}-expenses`);
    const entryDiv = document.createElement('div');
    entryDiv.className = 'expense-entry';
    
    // Different template for savings vs regular expenses
    if (category === 'savings') {
        entryDiv.innerHTML = `
            <div class="expense-entry-fields">
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" class="expense-label" placeholder="e.g., Emergency Fund" required>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" class="expense-amount" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Goal Amount</label>
                    <input type="number" class="savings-goal-amount" min="0" step="0.01" placeholder="Optional">
                    <span class="help-text">Set a target amount for this savings goal</span>
                </div>
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" class="expense-due-date" required>
                </div>
                <div class="form-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" class="expense-recurring" checked>
                        <span>Recurring monthly</span>
                    </label>
                </div>
                <div class="form-group">
                    <label>Annual Yield (%)</label>
                    <input type="number" class="savings-yield" min="0" max="100" step="0.01" value="0">
                </div>
            </div>
            <button type="button" class="btn btn-danger remove-expense">Remove</button>
        `;
    } else {
        entryDiv.innerHTML = `
            <div class="expense-entry-fields">
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" class="expense-label" required>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" class="expense-amount" min="0" step="0.01" required>
                </div>
                <div class="form-group outstanding-amount-group" style="display: none;">
                    <label>Outstanding Amount</label>
                    <input type="number" class="expense-outstanding-amount" min="0" step="0.01" value="0">
                </div>
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" class="expense-due-date" required>
                </div>
                <div class="form-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" class="expense-recurring">
                        <span>Recurring monthly</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="expense-one-time">
                        <span>One-time payment</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="expense-outstanding">
                        <span>Outstanding</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="expense-split-payment">
                        <span>Split across paychecks</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="expense-split-with-others">
                        <span>Split with others</span>
                    </label>
                </div>
                <div class="split-with-others">
                    <div class="split-partner">
                        <label>Split with (name)</label>
                        <input type="text" class="split-partner-name" placeholder="Enter name">
                    </div>
                    <div class="split-details">
                        <div class="split-ratio">
                            <label>Your share</label>
                            <input type="number" class="split-ratio-self" min="0" max="100" value="50">
                            <span>%</span>
                        </div>
                        <div class="split-ratio">
                            <label>Their share</label>
                            <input type="number" class="split-ratio-other" min="0" max="100" value="50">
                            <span>%</span>
                        </div>
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-danger remove-expense">Remove</button>
        `;
    }
    
    container.appendChild(entryDiv);
    
    // Add remove button handler
    entryDiv.querySelector('.remove-expense').addEventListener('click', () => {
        entryDiv.remove();
    });

    // Add handlers for non-savings expenses
    if (category !== 'savings') {
        const outstandingCheckbox = entryDiv.querySelector('.expense-outstanding');
        const outstandingAmountGroup = entryDiv.querySelector('.outstanding-amount-group');
        const expenseAmount = entryDiv.querySelector('.expense-amount');
        const recurringCheckbox = entryDiv.querySelector('.expense-recurring');
        const oneTimeCheckbox = entryDiv.querySelector('.expense-one-time');
        const splitPaymentCheckbox = entryDiv.querySelector('.expense-split-payment');
        const splitWithOthersCheckbox = entryDiv.querySelector('.expense-split-with-others');
        const splitWithOthersSection = entryDiv.querySelector('.split-with-others');
        const splitRatioSelf = entryDiv.querySelector('.split-ratio-self');
        const splitRatioOther = entryDiv.querySelector('.split-ratio-other');
        
        // Set up the outstanding checkbox handler
        outstandingCheckbox.addEventListener('change', (e) => {
            outstandingAmountGroup.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                const outstandingInput = outstandingAmountGroup.querySelector('.expense-outstanding-amount');
                outstandingInput.value = expenseAmount.value;
            }
        });

        // Update outstanding amount when expense amount changes
        expenseAmount.addEventListener('change', (e) => {
            if (outstandingCheckbox.checked) {
                const outstandingInput = outstandingAmountGroup.querySelector('.expense-outstanding-amount');
                outstandingInput.value = e.target.value;
            }
        });

        // Handle one-time and recurring checkbox interaction
        oneTimeCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                recurringCheckbox.checked = false;
            }
        });

        recurringCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                oneTimeCheckbox.checked = false;
            }
        });

        // Handle split with others checkbox
        splitWithOthersCheckbox.addEventListener('change', (e) => {
            splitWithOthersSection.style.display = e.target.checked ? 'block' : 'none';
        });

        // Handle split ratio synchronization
        splitRatioSelf.addEventListener('input', (e) => {
            const selfValue = parseFloat(e.target.value) || 0;
            splitRatioOther.value = Math.max(0, Math.min(100, 100 - selfValue));
        });

        splitRatioOther.addEventListener('input', (e) => {
            const otherValue = parseFloat(e.target.value) || 0;
            splitRatioSelf.value = Math.max(0, Math.min(100, 100 - otherValue));
        });
    }
};

// Add expense button handlers
document.querySelectorAll('.add-expense').forEach(button => {
    button.addEventListener('click', () => {
        addExpenseEntry(button.dataset.category);
    });
});

// Update budget summary display
const updateBudgetSummary = (budget) => {
    document.getElementById('summary-name').textContent = userData.name;
    document.getElementById('monthly-income').textContent = formatCurrency(budget.monthlyIncome);
    document.getElementById('target-savings').textContent = formatCurrency(budget.targetSavings);
    document.getElementById('total-expenses').textContent = formatCurrency(budget.totalExpenses);
    document.getElementById('remaining-budget').textContent = formatCurrency(budget.remainingBudget);
    document.getElementById('total-outstanding').textContent = formatCurrency(budget.totalOutstanding);
    document.getElementById('budget-after-outstanding').textContent = formatCurrency(budget.budgetAfterOutstanding);
    
    // Add paycheck breakdown section
    const paycheckBreakdown = document.createElement('div');
    paycheckBreakdown.className = 'paycheck-breakdown';
    paycheckBreakdown.innerHTML = `
        <h3>Paycheck Breakdown</h3>
        ${Object.entries(budget.paycheckTotals).map(([payday, totals]) => {
            // Get all expenses for this paycheck
            const paycheckExpenses = Object.entries(userData.expenses).flatMap(([category, expenses]) => 
                expenses.filter(expense => {
                    const assignedPaycheck = getPaycheckForExpense(expense, userData.income.paydays);
                    return assignedPaycheck === parseInt(payday) || 
                           (expense.splitPayment && userData.income.paydays.includes(parseInt(payday)));
                }).map(expense => ({...expense, category}))
            );

            return `
                <div class="paycheck-summary">
                    <h4>Paycheck on Day ${payday}</h4>
                    <div class="paycheck-details">
                        <p>Income: ${formatCurrency(totals.income)}</p>
                        <div class="paycheck-expenses">
                            <h5>Expenses:</h5>
                            <ul class="expense-list">
                                ${paycheckExpenses.map(expense => `
                                    <li>
                                        <span class="expense-name">${expense.label}</span>
                                        <span class="expense-info">
                                            ${formatCurrency(expense.splitPayment ? expense.amount / userData.income.paydays.length : expense.amount)}
                                            ${expense.splitPayment ? ' (Split)' : ''}
                                            ${expense.splitWithOthers ? ` (Your share: ${expense.splitDetails.selfRatio}%)` : ''}
                                        </span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <p>Regular Expenses: ${formatCurrency(totals.regularExpenses)}</p>
                        <p>Outstanding: ${formatCurrency(totals.outstandingExpenses)}</p>
                        <p class="remaining">Remaining: ${formatCurrency(totals.remaining)}</p>
                    </div>
                </div>
            `;
        }).join('')}
    `;
    
    // Update expense breakdown with detailed entries
    const expenseDetails = document.getElementById('expense-details');
    expenseDetails.innerHTML = '';
    expenseDetails.appendChild(paycheckBreakdown);
    
    const categories = {
        savings: 'Savings',
        housing: 'Housing',
        debt: 'Debt Payments',
        subscription: 'Subscriptions',
        essential: 'Other Essentials'
    };
    
    Object.entries(categories).forEach(([key, title]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'expense-category';
        
        const expenses = userData.expenses[key] || [];
        const totals = budget.categories[key] || { regular: 0, outstanding: 0 };
        
        if (key === 'savings') {
            categoryDiv.innerHTML = `
                <h4>${title} - ${formatCurrency(totals.regular)}</h4>
                <ul class="expense-list">
                    ${expenses.map(expense => {
                        const progressHtml = expense.goalAmount ? `
                            <div class="savings-goal-progress" id="progress-${expense.label.replace(/\s+/g, '-')}"></div>
                            <div class="savings-goal-info">
                                <div>Progress: <span class="current-amount">${formatCurrency(expense.currentAmount)}</span> / <span class="goal-amount">${formatCurrency(expense.goalAmount)}</span></div>
                            </div>
                        ` : '';
                        
                        return `
                            <li>
                                <div class="expense-details">
                                    <span>${expense.label}</span>
                                    <div class="expense-meta">
                                        <span class="due-date">Due: ${formatDate(expense.dueDate)}</span>
                                        ${expense.recurring ? '<span class="recurring-badge">Recurring</span>' : ''}
                                        <span class="yield-badge">Yield: ${expense.yield || 0}% APY</span>
                                        ${getPaycheckForExpense(expense, userData.income.paydays) > 0 ? 
                                            `<span class="paycheck-badge">Paycheck: Day ${getPaycheckForExpense(expense, userData.income.paydays)}</span>` : 
                                            '<span class="split-badge">Split Payment</span>'}
                                    </div>
                                    ${progressHtml}
                                </div>
                                <span>${formatCurrency(expense.amount)}</span>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;

            // Add progress wheels after the HTML is inserted
            expenses.forEach(expense => {
                if (expense.goalAmount) {
                    const progressContainer = document.getElementById(`progress-${expense.label.replace(/\s+/g, '-')}`);
                    if (progressContainer) {
                        const percentage = (expense.currentAmount / expense.goalAmount) * 100;
                        createProgressWheel(progressContainer, percentage);
                    }
                }
            });
        } else {
            categoryDiv.innerHTML = `
                <h4>${title} - ${formatCurrency(totals.regular + totals.outstanding)}</h4>
                <ul class="expense-list">
                    ${expenses.map(expense => `
                        <li class="${expense.outstanding ? 'outstanding' : ''}">
                            <div class="expense-details">
                                <span>${expense.label}</span>
                                <div class="expense-meta">
                                    <span class="due-date">Due: ${formatDate(expense.dueDate)}</span>
                                    ${expense.recurring ? '<span class="recurring-badge">Recurring</span>' : ''}
                                    ${expense.splitPayment ? '<span class="split-badge">Split Payment</span>' : 
                                        `<span class="paycheck-badge">Paycheck: Day ${getPaycheckForExpense(expense, userData.income.paydays)}</span>`}
                                    ${expense.outstanding ? `
                                        <span class="outstanding-badge">Outstanding: ${formatCurrency(expense.outstandingAmount || expense.amount)}</span>
                                        <span class="balance-after">After Payment: ${formatCurrency((expense.outstandingAmount || expense.amount) - expense.amount)}</span>
                                    ` : ''}
                                    ${expense.splitWithOthers ? `
                                        <span class="split-badge-with">Split with ${expense.splitDetails.partnerName} (${expense.splitDetails.selfRatio}% / ${expense.splitDetails.otherRatio}%)</span>
                                        <span class="balance-after">Your share: ${formatCurrency(expense.amount * expense.splitDetails.selfRatio / 100)}</span>
                                    ` : ''}
                                </div>
                            </div>
                            <span>${formatCurrency(expense.amount)}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
        
        expenseDetails.appendChild(categoryDiv);
    });

    // Update upcoming expenses
    updateUpcomingExpenses();
};

// Form submission handlers
profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userData.name = document.getElementById('user-name').value;
    saveUserData();
    updateProfileList();
    currentStep++;
    updateSteps(currentStep);
    updateSections(currentStep);
});

incomeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userData.income.amount = parseFloat(document.getElementById('income-amount').value);
    userData.income.frequency = document.getElementById('income-frequency').value;
    userData.savingsGoal = parseFloat(document.getElementById('savings-goal').value);
    
    // Get paydays
    const paydaysInput = document.getElementById('income-paydays');
    userData.income.paydays = paydaysInput.value
        .split(',')
        .map(day => parseInt(day.trim()))
        .filter(day => !isNaN(day) && day >= 1 && day <= 31)
        .sort((a, b) => a - b);
    
    saveUserData();
    currentStep++;
    updateSteps(currentStep);
    updateSections(currentStep);
});

expensesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Ensure userData.expenses exists with all categories
    if (!userData.expenses) {
        userData.expenses = {
            savings: [],
            housing: [],
            debt: [],
            subscription: [],
            essential: []
        };
    }

    // Ensure all categories exist
    ['savings', 'housing', 'debt', 'subscription', 'essential'].forEach(category => {
        if (!userData.expenses[category]) {
            userData.expenses[category] = [];
        }
    });
    
    // Clear previous expenses
    Object.keys(userData.expenses).forEach(category => {
        userData.expenses[category] = [];
    });
    
    // Collect all expenses by category
    ['savings', 'housing', 'debt', 'subscription', 'essential'].forEach(category => {
        const container = document.getElementById(`${category}-expenses`);
        const entries = container.querySelectorAll('.expense-entry');
        
        entries.forEach(entry => {
            const label = entry.querySelector('.expense-label').value;
            const amount = parseFloat(entry.querySelector('.expense-amount').value) || 0;
            const dueDate = entry.querySelector('.expense-due-date').value;
            const recurringCheckbox = entry.querySelector('.expense-recurring');
            const recurring = recurringCheckbox ? recurringCheckbox.checked : false;
            
            if (category === 'savings') {
                const yield = parseFloat(entry.querySelector('.savings-yield').value) || 0;
                const goalAmount = parseFloat(entry.querySelector('.savings-goal-amount').value) || 0;
                if (label && amount > 0 && dueDate) {
                    userData.expenses[category].push({
                        label,
                        amount,
                        dueDate,
                        recurring,
                        yield,
                        goalAmount,
                        currentAmount: amount // Initialize currentAmount with the amount
                    });
                }
            } else {
                const outstandingCheckbox = entry.querySelector('.expense-outstanding');
                const oneTimeCheckbox = entry.querySelector('.expense-one-time');
                const splitPaymentCheckbox = entry.querySelector('.expense-split-payment');
                const splitWithOthersCheckbox = entry.querySelector('.expense-split-with-others');
                const outstanding = outstandingCheckbox ? outstandingCheckbox.checked : false;
                const oneTime = oneTimeCheckbox ? oneTimeCheckbox.checked : false;
                const splitPayment = splitPaymentCheckbox ? splitPaymentCheckbox.checked : false;
                const splitWithOthers = splitWithOthersCheckbox ? splitWithOthersCheckbox.checked : false;
                const outstandingAmount = outstanding ? 
                    (parseFloat(entry.querySelector('.expense-outstanding-amount').value) || amount) : 0;
                
                let splitDetails = null;
                if (splitWithOthers) {
                    splitDetails = {
                        partnerName: entry.querySelector('.split-partner-name').value,
                        selfRatio: parseFloat(entry.querySelector('.split-ratio-self').value) || 50,
                        otherRatio: parseFloat(entry.querySelector('.split-ratio-other').value) || 50
                    };
                }
                
                if (label && amount > 0 && dueDate) {
                    userData.expenses[category].push({ 
                        label, 
                        amount, 
                        dueDate, 
                        recurring,
                        oneTime,
                        outstanding,
                        splitPayment,
                        outstandingAmount: outstanding ? outstandingAmount : 0,
                        splitWithOthers,
                        splitDetails
                    });
                }
            }
        });
    });
    
    saveUserData();
    cleanupExpiredExpenses();
    const budget = calculateBudget();
    updateBudgetSummary(budget);
    
    currentStep++;
    updateSteps(currentStep);
    updateSections(currentStep);
});

// Start over button
document.getElementById('start-over').addEventListener('click', () => {
    currentStep = 1;
    const { activeProfile } = loadProfiles();
    
    if (activeProfile) {
        loadUserData(activeProfile);
    } else {
        userData = {
            name: '',
            income: { amount: 0, frequency: 'monthly' },
            savingsGoal: 20,
            expenses: {
                savings: [],
                housing: [],
                debt: [],
                subscription: [],
                essential: []
            },
            reminderDays: 3
        };
    }
    
    // Reset forms
    profileForm.reset();
    incomeForm.reset();
    expensesForm.reset();
    
    if (activeProfile) {
        document.getElementById('user-name').value = userData.name;
        document.getElementById('user-name').readOnly = true;
    } else {
        document.getElementById('user-name').readOnly = false;
    }
    
    // Remove all added expense entries except the first one in each category
    ['savings', 'housing', 'debt', 'subscription', 'essential'].forEach(category => {
        const container = document.getElementById(`${category}-expenses`);
        const entries = container.querySelectorAll('.expense-entry');
        
        // Keep the first entry, remove the rest
        entries.forEach((entry, index) => {
            if (index > 0) {
                entry.remove();
            } else {
                // Reset the first entry
                entry.querySelector('.expense-label').value = '';
                entry.querySelector('.expense-amount').value = '';
                if (entry.querySelector('.expense-due-date')) {
                    entry.querySelector('.expense-due-date').value = '';
                }
                if (entry.querySelector('.savings-yield')) {
                    entry.querySelector('.savings-yield').value = '0';
                }
            }
        });
    });
    
    updateSteps(currentStep);
    updateSections(currentStep);
});

// Add reminder days change handler
document.getElementById('reminder-days').addEventListener('change', (e) => {
    userData.reminderDays = parseInt(e.target.value);
    saveUserData();
});

// Initialize notification checking
const initializeNotifications = async () => {
    const hasPermission = await checkNotificationPermission();
    if (hasPermission) {
        // Check for upcoming expenses every hour
        setInterval(checkUpcomingExpenses, 1000 * 60 * 60);
        // Also check immediately
        checkUpcomingExpenses();
    }
};

// Add function to clean up expired one-time expenses
const cleanupExpiredExpenses = () => {
    let hasChanges = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    Object.keys(userData.expenses).forEach(category => {
        if (category !== 'savings') {
            const expenses = userData.expenses[category];
            const activeExpenses = expenses.filter(expense => {
                if (expense.oneTime) {
                    const dueDate = new Date(expense.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate >= today;
                }
                return true;
            });

            if (activeExpenses.length !== expenses.length) {
                userData.expenses[category] = activeExpenses;
                hasChanges = true;
            }
        }
    });

    if (hasChanges) {
        saveUserData();
        const budget = calculateBudget();
        updateBudgetSummary(budget);
    }
};

// Add cleanup check on page load
document.addEventListener('DOMContentLoaded', () => {
    updateProfileList();
    initializeNotifications();
    cleanupExpiredExpenses(); // Clean up any expired one-time expenses
    
    // Set reminder days from user data
    document.getElementById('reminder-days').value = userData.reminderDays;
});

// Add function to create progress wheel
const createProgressWheel = (container, percentage) => {
    const radius = 54;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(100, Math.max(0, percentage));
    const offset = circumference - (progress / 100) * circumference;

    container.innerHTML = `
        <svg class="progress-ring" width="120" height="120">
            <circle class="progress-ring-circle" 
                stroke-width="8"
                r="${radius}"
                cx="60"
                cy="60"/>
            <circle class="progress-ring-progress" 
                stroke-width="8"
                r="${radius}"
                cx="60"
                cy="60"
                style="stroke-dasharray: ${circumference} ${circumference}; stroke-dashoffset: ${offset}"/>
        </svg>
        <div class="progress-text">
            <span class="percentage">${Math.round(progress)}%</span>
        </div>
    `;
}; 