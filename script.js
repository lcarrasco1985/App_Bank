document.addEventListener('DOMContentLoaded', function() {
    // ===== VARIABLES GLOBALES =====
    const bankForm = document.getElementById('bankForm');
    const clearBtn = document.getElementById('clearBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const accountsTableBody = document.getElementById('accountsTableBody');
    const totalAccountsSpan = document.getElementById('totalAccounts');
    const totalBalanceSpan = document.getElementById('totalBalance');
    const editModal = document.getElementById('editModal');
    const closeModal = document.querySelector('.close');
    const editFormContainer = document.getElementById('editFormContainer');
    const accountType = document.getElementById('accountType');
    const investmentFields = document.getElementById('investmentFields');
    const savingsFields = document.getElementById('savingsFields');
    const fixedTermFields = document.getElementById('fixedTermFields');

    // Cargar cuentas o inicializar array vacío
    let accounts = [];
    try {
        const storedAccounts = localStorage.getItem('bankAccounts');
        accounts = storedAccounts ? JSON.parse(storedAccounts) : [];
    } catch (e) {
        console.error("Error al cargar cuentas:", e);
        accounts = [];
    }
    
    let editingAccountId = null;

    // ===== INICIALIZACIÓN =====
    init();

    // ===== EVENT LISTENERS =====
    bankForm.addEventListener('submit', handleFormSubmit);
    clearBtn.addEventListener('click', clearForm);
    searchBtn.addEventListener('click', searchAccounts);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') searchAccounts();
    });
    closeModal.addEventListener('click', closeEditModal);
    window.addEventListener('click', function(e) {
        if (e.target === editModal) closeEditModal();
    });
    
    // Mostrar/ocultar campos según tipo de cuenta
    accountType.addEventListener('change', function() {
        const type = this.value;
        
        // Oculta todos los grupos primero
        investmentFields.style.display = 'none';
        savingsFields.style.display = 'none';
        fixedTermFields.style.display = 'none';

        // Muestra solo los campos relevantes
        if (type === 'plazo_fijo') {
            fixedTermFields.style.display = 'block';
        } else if (type === 'inversion') {
            investmentFields.style.display = 'block';
        } else if (type === 'ahorro' || type === 'credito') {
            savingsFields.style.display = 'block';
        }
    });
    
    // ===== FUNCIONES PRINCIPALES =====
    function init() {
        renderAccountsTable();
        updateSummary();
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Obtener valores del formulario usando getNumberValue
        const bankName = document.getElementById('bankName').value.trim();
        const accountType = document.getElementById('accountType').value;
        const accountNumber = document.getElementById('accountNumber').value.trim();
        const accountHolder = document.getElementById('accountHolder').value.trim();
        const openingDate = document.getElementById('openingDate').value;
        const balance = getNumberValue('balance');
        const currency = document.getElementById('currency').value;
        const status = document.getElementById('status').value;
        const monthlyFee = getNumberValue('monthlyFee');
        const fixedAmount = getNumberValue('fixedAmount');
        const interestRate = getNumberValue('interestRate');
        const startDate = document.getElementById('startDate')?.value || '';
        const maturityDate = document.getElementById('maturityDate')?.value || '';
        const initialInvestment = getNumberValue('initialInvestment');
        const currentValue = getNumberValue('currentValue');
        const riskLevel = document.getElementById('riskLevel')?.value || '';

        // Validación básica
        if (!bankName || !accountNumber || !accountHolder) {
            alert('Por favor complete los campos requeridos');
            return;
        }

        // Validar número de cuenta único
        if (isDuplicateAccount(accountNumber) && !editingAccountId) {
            alert('¡Ya existe una cuenta con este número!');
            return;
        }

        // Crear objeto de cuenta
        const account = {
            id: editingAccountId || Date.now().toString(),
            bankName,
            accountType,
            accountNumber,
            accountHolder,
            openingDate,
            balance,
            currency,
            status,
            monthlyFee,
            fixedAmount,
            interestRate,
            startDate,
            maturityDate,
            initialInvestment,
            currentValue,
            riskLevel,
            lastUpdated: new Date().toISOString()
        };

        if (editingAccountId) {
            // Actualizar cuenta existente
            const index = accounts.findIndex(acc => acc.id === editingAccountId);
            if (index !== -1) {
                accounts[index] = account;
            }
            editingAccountId = null;
        } else {
            // Agregar nueva cuenta
            accounts.push(account);
        }

        // Guardar en localStorage
        try {
            localStorage.setItem('bankAccounts', JSON.stringify(accounts));
            alert(`Cuenta ${editingAccountId ? 'actualizada' : 'registrada'} correctamente!`);
        } catch (e) {
            console.error("Error al guardar:", e);
            alert('Error al guardar los datos');
            return;
        }

        // Actualizar UI
        renderAccountsTable();
        updateSummary();
        clearForm();
        closeEditModal();
    }

    function isDuplicateAccount(accountNumber) {
        return accounts.some(account => 
            account.accountNumber === accountNumber && 
            account.id !== editingAccountId
        );
    }

    function clearForm() {
        bankForm.reset();
        editingAccountId = null;
        // Ocultar todos los campos específicos
        investmentFields.style.display = 'none';
        fixedTermFields.style.display = 'none';
        savingsFields.style.display = 'block';
    }

    function renderAccountsTable(filteredAccounts = null) {
        const accountsToRender = filteredAccounts || accounts;
        
        if (accountsToRender.length === 0) {
            accountsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-accounts">No hay cuentas registradas</td>
                </tr>
            `;
            return;
        }
        
        accountsTableBody.innerHTML = accountsToRender.map(account => {
            // Asegurar valores por defecto
            const bankName = getAccountBankName(account.bankName) || 'No especificado';
            const accountType = getAccountTypeName(account.accountType) || 'No especificado';
            const accountNumber = account.accountNumber || 'No especificado';
            const accountHolder = account.accountHolder || 'No especificado';
            const balance = isNaN(account.balance) ? 0 : account.balance;
            const currency = account.currency || 'USD';
            const status = getStatusName(account.status) || 'No especificado';
            
            return `
                <tr>
                    <td>${bankName}</td>
                    <td>${accountType}</td>
                    <td>${accountNumber}</td>
                    <td>${accountHolder}</td>
                    <td class="number-formatted">${formatCurrency(balance, currency)}</td>
                    <td>${currency}</td>
                    <td class="status-${account.status}">${status}</td>
                    <td class="actions">
                        <button class="action-btn edit" data-id="${account.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${account.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Agregar event listeners a los botones de acción
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => editAccount(btn.dataset.id));
        });
        
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteAccount(btn.dataset.id));
        });
    }
    
    function editAccount(accountId) {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) return;
        
        editingAccountId = accountId;
        
        // Llenar el formulario del modal con los datos de la cuenta
        editFormContainer.innerHTML = `
            <form id="editBankForm">
                <div class="form-group">
                    <label for="editBankName"><i class="fas fa-university"></i> Banco:</label>
                    <input type="text" id="editBankName" value="${account.bankName}" required>
                </div>
                
                <div class="form-group">
                    <label for="editAccountType"><i class="fas fa-credit-card"></i> Tipo de Cuenta:</label>
                    <select id="editAccountType" required>
                        <option value="ahorro" ${account.accountType === 'ahorro' ? 'selected' : ''}>Cuenta de Ahorro</option>
                        <option value="plazo_fijo" ${account.accountType === 'plazo_fijo' ? 'selected' : ''}>Cuenta a Plazo Fijo</option>
                        <option value="inversion" ${account.accountType === 'inversion' ? 'selected' : ''}>Cuenta de Inversión</option>
                        <option value="credito" ${account.accountType === 'credito' ? 'selected' : ''}>Tarjeta de Crédito</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editAccountNumber"><i class="fas fa-hashtag"></i> Número de Cuenta:</label>
                    <input type="text" id="editAccountNumber" value="${account.accountNumber}" required>
                </div>
                
                <div class="form-group">
                    <label for="editAccountHolder"><i class="fas fa-user"></i> Titular:</label>
                    <input type="text" id="editAccountHolder" value="${account.accountHolder}" required>
                </div>
                
                <div class="form-group">
                    <label for="editOpeningDate"><i class="fas fa-calendar-alt"></i> Fecha de Apertura:</label>
                    <input type="date" id="editOpeningDate" value="${account.openingDate}" required>
                </div>
                
                <div class="form-group">
                    <label for="editBalance"><i class="fas fa-money-bill-wave"></i> Saldo Actual:</label>
                    <input type="text" id="editBalance" class="number-input" value="${account.balance}" required>
                </div>
                
                <div class="form-group">
                    <label for="editCurrency"><i class="fas fa-coins"></i> Moneda:</label>
                    <select id="editCurrency" required>
                        <option value="PEN" ${account.currency === 'PEN' ? 'selected' : ''}>Soles Peruanos (PEN)</option>
                        <option value="USD" ${account.currency === 'USD' ? 'selected' : ''}>Dólares (USD)</option>
                        <option value="EUR" ${account.currency === 'EUR' ? 'selected' : ''}>Euros (EUR)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editStatus"><i class="fas fa-info-circle"></i> Estado:</label>
                    <select id="editStatus" required>
                        <option value="active" ${account.status === 'active' ? 'selected' : ''}>Activa</option>
                        <option value="inactive" ${account.status === 'inactive' ? 'selected' : ''}>Inactiva</option>
                        <option value="blocked" ${account.status === 'blocked' ? 'selected' : ''}>Bloqueada</option>
                        <option value="canceled" ${account.status === 'canceled' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
                    <button type="button" id="cancelEdit" class="btn btn-secondary"><i class="fas fa-times"></i> Cancelar</button>
                </div>
            </form>
        `;
        
        // Configurar event listeners para campos numéricos en el modal
        setupEditModalNumberFormatting();
        
        // Configurar el event listener para el formulario de edición
        document.getElementById('editBankForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Actualizar los valores del formulario principal con los del modal
            document.getElementById('bankName').value = document.getElementById('editBankName').value;
            document.getElementById('accountType').value = document.getElementById('editAccountType').value;
            document.getElementById('accountNumber').value = document.getElementById('editAccountNumber').value;
            document.getElementById('accountHolder').value = document.getElementById('editAccountHolder').value;
            document.getElementById('openingDate').value = document.getElementById('editOpeningDate').value;
            document.getElementById('balance').value = document.getElementById('editBalance').value;
            document.getElementById('currency').value = document.getElementById('editCurrency').value;
            document.getElementById('status').value = document.getElementById('editStatus').value;
            
            // Enviar el formulario principal
            bankForm.dispatchEvent(new Event('submit'));
        });
        
        // Configurar el botón de cancelar
        document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
        
        // Mostrar el modal
        editModal.style.display = 'block';
    }
    
    function closeEditModal() {
        editModal.style.display = 'none';
        editingAccountId = null;
    }
    
    function deleteAccount(accountId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
            accounts = accounts.filter(acc => acc.id !== accountId);
            localStorage.setItem('bankAccounts', JSON.stringify(accounts));
            renderAccountsTable();
            updateSummary();
            alert('Cuenta eliminada correctamente.');
        }
    }
    
    function searchAccounts() {
        const searchTerm = searchInput.value.toLowerCase();
        
        if (!searchTerm) {
            renderAccountsTable();
            return;
        }
        
        const filteredAccounts = accounts.filter(account => 
            account.bankName.toLowerCase().includes(searchTerm) ||
            account.accountNumber.toLowerCase().includes(searchTerm) ||
            account.accountHolder.toLowerCase().includes(searchTerm)
        );
        
        renderAccountsTable(filteredAccounts);
    }
    
    function updateSummary() {
        totalAccountsSpan.textContent = accounts.length;
        
        const totalBalance = accounts.reduce((sum, account) => {
            const balance = isNaN(account.balance) ? 0 : parseFloat(account.balance);
            return sum + balance;
        }, 0);
        
        totalBalanceSpan.textContent = formatCurrency(totalBalance, 'USD');
    }
    function getAccountBankName(type){
		const types = {
            'bcp': 'BCP',
			'itb': 'InterBank',            
            'falabella': 'Banco Falabella',
            'cmacica': 'CMAC Ica',
			'cmacaqp': 'CMAC Arequipa',
			'coopacesperanza': 'COOPAC La Esperanza'								
        };	
		return types[type] || type;
	}
	
    function getAccountTypeName(type) {
        const types = {
            'ahorro': 'Ahorro',
            'plazo_fijo': 'Plazo Fijo',
            'inversion': 'Inversión',
            'credito': 'Tarjeta Crédito'
        };
        return types[type] || type;
    }
    
    function getStatusName(status) {
        const statuses = {
            'active': 'Activa',
            'inactive': 'Inactiva',
            'blocked': 'Bloqueada',
            'canceled': 'Cancelada'
        };
        return statuses[status] || status;
    }
    
    function formatCurrency(amount, currency) {
        // Asegurarse de que amount sea un número
        const numericAmount = isNaN(amount) ? 0 : parseFloat(amount);
        
        try {
            // Formatear con separadores de miles y decimales
            const formatted = new Intl.NumberFormat('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numericAmount);
            
            // Añadir símbolo de moneda
            if (currency === 'USD') return `$${formatted}`;
            if (currency === 'EUR') return `€${formatted}`;
            return `S/${formatted}`;
        } catch (e) {
            // Fallback si hay error con el formateo
            return `${numericAmount.toFixed(2)} ${currency}`;
        }
    }

    // ===== FUNCIONES DE FORMATEO NUMÉRICO SIMPLIFICADAS =====
    function parseNumber(value) {
        if (!value || value === '') return 0;
        
        // Eliminar todos los caracteres no numéricos excepto punto decimal
        const cleanValue = value.toString().replace(/[^\d.]/g, '');
        return parseFloat(cleanValue) || 0;
    }

    function formatNumberInput(e) {
        const input = e.target;
        let value = input.value;
        
        // Permitir solo números y un punto decimal
        value = value.replace(/[^\d.]/g, '');
        
        // Permitir solo un punto decimal
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Limitar a 2 decimales
        if (parts.length === 2) {
            value = parts[0] + '.' + parts[1].slice(0, 2);
        }
        
        input.value = value;
    }

    function formatNumberOnBlur(e) {
        const input = e.target;
        const value = input.value;
        
        if (!value) return;
        
        const number = parseNumber(value);
        if (number === 0) {
            input.value = '';
            return;
        }
        
        // Formatear solo si es un número válido
        if (!isNaN(number)) {
            input.value = new Intl.NumberFormat('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(number);
        }
    }

    function handleNumberFocus(e) {
        const input = e.target;
        const value = input.value;
        
        if (!value) return;
        
        // Convertir el valor formateado de vuelta a número simple para edición
        const number = parseNumber(value);
        if (!isNaN(number) && number > 0) {
            input.value = number.toString();
        }
    }

    // Función para obtener valores numéricos del formulario
    function getNumberValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? parseNumber(element.value) : 0;
    }

    function setupEditModalNumberFormatting() {
        const editBalanceInput = document.getElementById('editBalance');
        if (editBalanceInput) {
            editBalanceInput.addEventListener('input', formatNumberInput);
            editBalanceInput.addEventListener('blur', formatNumberOnBlur);
            editBalanceInput.addEventListener('focus', handleNumberFocus);
        }
    }

    // Inicialización simplificada
    function initializeNumberFormatting() {
        document.querySelectorAll('.number-input').forEach(input => {
            input.addEventListener('input', formatNumberInput);
            input.addEventListener('blur', formatNumberOnBlur);
            input.addEventListener('focus', handleNumberFocus);
        });
    }

    // INICIALIZAR EL FORMATEO NUMÉRICO
    initializeNumberFormatting();
});