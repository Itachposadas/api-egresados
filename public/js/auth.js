// auth.js - Sistema de autenticación

class AuthSystem {
    constructor() {
        this.USERS = {
            'admin': '1234',
            'coordinador': 'coordinador2024',
            'secretaria': 'sec123'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkRememberedUser();
    }
    
    setupEventListeners() {
        // Mostrar/ocultar contraseña
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }
        
        // Formulario de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Contactar administrador
        const contactAdmin = document.getElementById('contact-admin');
        if (contactAdmin) {
            contactAdmin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Contacta a: administracion@umb.edu.co', 'info');
            });
        }
        
        // Recuperar contraseña
        const forgotPassword = document.querySelector('.forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification(
                    'Para recuperar tu contraseña, contacta al departamento de sistemas.',
                    'info'
                );
            });
        }
    }
    
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#toggle-password i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }
    
    checkRememberedUser() {
        const rememberedUser = localStorage.getItem('rememberedUser');
        if (rememberedUser) {
            document.getElementById('username').value = rememberedUser;
            document.getElementById('remember-me').checked = true;
        }
    }
    
    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        // Validaciones
        if (!username || !password) {
            this.showNotification('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        // Simular validación de credenciales
        await this.simulateLoading();
        
        if (this.validateCredentials(username, password)) {
            // Guardar en localStorage si "Recordarme" está activado
            if (rememberMe) {
                localStorage.setItem('rememberedUser', username);
            } else {
                localStorage.removeItem('rememberedUser');
            }
            
            // Guardar sesión
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('currentUser', username);
            sessionStorage.setItem('userRole', this.getUserRole(username));
            
            this.showNotification('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
            
            // Redirigir al dashboard después de 1.5 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            this.showNotification('Usuario o contraseña incorrectos.', 'error');
        }
    }
    
    validateCredentials(username, password) {
        return this.USERS[username] === password;
    }
    
    getUserRole(username) {
        // Simular roles diferentes
        if (username === 'admin') return 'administrador';
        if (username === 'coordinador') return 'coordinador';
        return 'usuario';
    }
    
    simulateLoading() {
        return new Promise(resolve => {
            // Cambiar texto del botón
            const submitBtn = document.querySelector('.btn-auth');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                resolve();
            }, 1000);
        });
    }
    
    showNotification(message, type) {
        // Usar la notificación existente o crear una nueva
        let notification = document.getElementById('notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = `notification ${type}`;
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});

// Función para verificar sesión en otras páginas
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname.split('/').pop();
    
    // Si no está logueado y está en una página protegida, redirigir
    if (!isLoggedIn && currentPage === 'dashboard.html') {
        window.location.href = 'login.html';
        return false;
    }
    
    // Si está logueado y está en login, redirigir al dashboard
    if (isLoggedIn && currentPage === 'login.html') {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// Función para cerrar sesión
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}