class ControlEgresados {
    constructor() {
        // Ajusta esta URL a tu backend REAL
        this.API_URL = 'https://api-egresados.onrender.com'; // REEMPLAZA ESTO
        
        this.egresadoIdToDelete = null;
        this.currentEditId = null;
        this.lastSearchTerm = '';
        this.filteredEgresados = [];
        this.allEgresados = [];
        
        this.init();
    }
    
    init() {
        this.ocultarModalEliminar();
        this.setupEventListeners();
        this.cargarEgresados();
    }
    
    async cargarEgresados() {
        try {
            this.mostrarLoading(true);
            console.log('Cargando egresados desde:', this.API_URL);
            
            const response = await fetch(this.API_URL);
            console.log('Respuesta HTTP:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Datos recibidos:', data);
            
            // Manejar diferentes formatos de respuesta
            if (data.egresados && Array.isArray(data.egresados)) {
                this.allEgresados = data.egresados;
                console.log('Egresados cargados (formato con paginación):', this.allEgresados.length);
            } else if (Array.isArray(data)) {
                this.allEgresados = data;
                console.log('Egresados cargados (formato array simple):', this.allEgresados.length);
            } else {
                console.error('Formato de respuesta no válido:', data);
                this.allEgresados = [];
            }
            
            this.renderizarEgresados(this.allEgresados);
            this.actualizarEstadisticas(this.allEgresados.length);
            
        } catch (error) {
            console.error('Error cargando egresados:', error);
            this.mostrarNotificacion('Error al cargar egresados. Verifica la conexión.', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    renderizarEgresados(egresados) {
        const tbody = document.getElementById('egresados-body');
        const noData = document.getElementById('no-data');
        
        console.log('Renderizando egresados:', egresados);
        
        if (!egresados || egresados.length === 0) {
            tbody.innerHTML = '';
            if (noData) noData.style.display = 'block';
            return;
        }
        
        if (noData) noData.style.display = 'none';
        
        tbody.innerHTML = egresados.map(egresado => {
            console.log('Procesando egresado:', egresado);
            
            // Manejar campos con valores por defecto para evitar undefined
            const id = egresado.id || egresado._id || '';
            const matricula = egresado.matricula || '';
            const nombreCompleto = egresado.nombre_completo || egresado.nombreCompleto || egresado.nombre || '';
            const carrera = egresado.carrera || '';
            const generacion = egresado.generacion || '';
            const estatus = egresado.estatus || 'Sin estatus'; // Valor por defecto
            
            // Crear clase CSS segura para el estatus
            let estatusClass = 'sin-estatus';
            if (estatus && estatus !== 'Sin estatus') {
                // Usar toLowerCase solo si estatus no es undefined/null
                estatusClass = String(estatus).toLowerCase().replace(/\s+/g, '-');
            }
            
            console.log(`Egresado ${id}:`, { matricula, nombreCompleto, estatus, estatusClass });
            
            return `
                <tr data-id="${id}">
                    <td>${matricula}</td>
                    <td>${nombreCompleto}</td>
                    <td>${carrera}</td>
                    <td>${generacion}</td>
                    <td>
                        <span class="estatus-badge estatus-${estatusClass}">
                            ${estatus}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-edit" data-id="${id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-delete" data-id="${id}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.agregarEventListenersTabla();
    }
    
    agregarEventListenersTabla() {
        // Botones de editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.editarEgresado(id);
            });
        });
        
        // Botones de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.mostrarModalEliminar(id);
            });
        });
    }
    
    async guardarEgresado(event) {
        event.preventDefault();
        console.log('Guardando egresado...');
        
        // Validaciones básicas
        const errores = this.validarFormulario();
        if (errores.length > 0) {
            console.log('Errores de validación:', errores);
            this.mostrarNotificacion(errores[0], 'error');
            return;
        }
        
        // Preparar datos
        const formData = {
            matricula: document.getElementById('matricula').value.trim(),
            nombreCompleto: document.getElementById('nombreCompleto').value.trim(),
            carrera: document.getElementById('carrera').value,
            generacion: document.getElementById('generacion').value.trim(),
            estatus: document.getElementById('estatus').value,
            domicilio: document.getElementById('domicilio').value.trim(),
            genero: document.getElementById('genero').value,
            telefono: document.getElementById('telefono').value.trim(),
            correo: document.getElementById('correo').value.trim()
        };
        
        console.log('Datos a enviar:', formData);
        
        try {
            let url = this.API_URL;
            let method = 'POST';
            
            if (this.currentEditId) {
                url = `${this.API_URL}/${this.currentEditId}`;
                method = 'PUT';
                console.log('Actualizando egresado ID:', this.currentEditId);
            } else {
                console.log('Creando nuevo egresado');
            }
            
            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            console.log('Respuesta del servidor:', response.status, response.statusText);
            
            const result = await response.json();
            console.log('Resultado:', result);
            
            if (!response.ok) {
                throw new Error(result.error || result.message || 'Error en la operación');
            }
            
            // Mensaje de éxito
            const mensaje = this.currentEditId 
                ? 'Egresado actualizado correctamente' 
                : 'Egresado agregado correctamente';
            
            console.log('Éxito:', mensaje);
            this.mostrarNotificacion(mensaje, 'success');
            this.limpiarFormulario();
            this.cargarEgresados();
            
        } catch (error) {
            console.error('Error guardando egresado:', error);
            this.mostrarNotificacion(error.message, 'error');
        }
    }
    
    validarFormulario() {
        const errores = [];
        
        // Obtener valores
        const matricula = document.getElementById('matricula').value.trim();
        const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
        const carrera = document.getElementById('carrera').value;
        const generacion = document.getElementById('generacion').value.trim();
        const estatus = document.getElementById('estatus').value;
        const domicilio = document.getElementById('domicilio').value.trim();
        const genero = document.getElementById('genero').value;
        const correo = document.getElementById('correo').value.trim();
        
        console.log('Validando formulario:', { matricula, nombreCompleto, carrera });
        
        // Validar matrícula
        if (!matricula) {
            errores.push('La matrícula es requerida');
        } else if (!/^\d{8}$/.test(matricula)) {
            errores.push('La matrícula debe tener exactamente 8 dígitos numéricos');
        }
        
        // Validar nombre completo
        if (!nombreCompleto || nombreCompleto.length < 5) {
            errores.push('El nombre completo debe tener al menos 5 caracteres');
        }
        
        // Validar carrera
        if (!carrera) {
            errores.push('Seleccione una carrera');
        }
        
        // Validar generación
        if (!generacion) {
            errores.push('La generación es requerida');
        } else if (!/^\d{4}-\d{4}$/.test(generacion)) {
            errores.push('La generación debe tener formato AAAA-AAAA (ej: 2014-2019)');
        }
        
        // Validar estatus
        if (!estatus) {
            errores.push('Seleccione un estatus');
        }
        
        // Validar domicilio
        if (!domicilio || domicilio.length < 10) {
            errores.push('El domicilio debe tener al menos 10 caracteres');
        }
        
        // Validar género
        if (!genero) {
            errores.push('Seleccione un género');
        }
        
        // Validar correo
        if (!correo) {
            errores.push('El correo electrónico es requerido');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            errores.push('Ingrese un correo electrónico válido');
        }
        
        return errores;
    }
    
    async editarEgresado(id) {
        try {
            this.mostrarLoading(true);
            console.log('Editando egresado ID:', id);
            
            const response = await fetch(`${this.API_URL}/${id}`);
            console.log('Respuesta para editar:', response.status);
            
            if (!response.ok) {
                throw new Error('Error al obtener datos');
            }
            
            const egresado = await response.json();
            console.log('Datos del egresado:', egresado);
            
            // Llenar formulario
            document.getElementById('egresado-id').value = egresado.id || egresado._id || '';
            document.getElementById('matricula').value = egresado.matricula || '';
            
            // Manejar nombre completo
            let nombreCompleto = '';
            if (egresado.nombre_completo) {
                nombreCompleto = egresado.nombre_completo;
            } else if (egresado.nombreCompleto) {
                nombreCompleto = egresado.nombreCompleto;
            } else if (egresado.nombre && egresado.apellido) {
                nombreCompleto = `${egresado.nombre} ${egresado.apellido}`;
            }
            document.getElementById('nombreCompleto').value = nombreCompleto;
            
            document.getElementById('carrera').value = egresado.carrera || '';
            document.getElementById('generacion').value = egresado.generacion || '';
            document.getElementById('estatus').value = egresado.estatus || '';
            document.getElementById('domicilio').value = egresado.domicilio || '';
            document.getElementById('genero').value = egresado.genero || '';
            document.getElementById('telefono').value = egresado.telefono || '';
            document.getElementById('correo').value = egresado.correo || '';
            
            // Cambiar título
            const formTitle = document.getElementById('form-title');
            if (formTitle) {
                formTitle.innerHTML = '<i class="fas fa-user-edit"></i> Editar Egresado';
            }
            
            // Mostrar botón cancelar
            const cancelBtn = document.getElementById('cancel-btn');
            if (cancelBtn) {
                cancelBtn.style.display = 'inline-flex';
            }
            
            this.currentEditId = id;
            
            // Scroll al formulario
            document.querySelector('.form-section').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
        } catch (error) {
            console.error('Error editando egresado:', error);
            this.mostrarNotificacion('Error al cargar datos para editar', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    cancelarEdicion() {
        this.limpiarFormulario();
        const formTitle = document.getElementById('form-title');
        if (formTitle) {
            formTitle.innerHTML = '<i class="fas fa-user-plus"></i> Agregar Nuevo Egresado';
        }
        
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
        
        this.currentEditId = null;
    }
    
    limpiarFormulario() {
        const form = document.getElementById('egresado-form');
        if (form) {
            form.reset();
        }
        document.getElementById('egresado-id').value = '';
        this.currentEditId = null;
    }
    
    mostrarModalEliminar(id) {
        this.egresadoIdToDelete = id;
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
        }
    }
    
    async eliminarEgresado() {
        if (!this.egresadoIdToDelete) return;
        
        console.log('Eliminando egresado ID:', this.egresadoIdToDelete);
        
        try {
            const response = await fetch(`${this.API_URL}/${this.egresadoIdToDelete}`, {
                method: 'DELETE'
            });
            
            console.log('Respuesta de eliminación:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Error al eliminar');
            }
            
            this.mostrarNotificacion('Egresado eliminado correctamente', 'success');
            this.cargarEgresados();
            
        } catch (error) {
            console.error('Error eliminando egresado:', error);
            this.mostrarNotificacion(error.message || 'Error al eliminar egresado', 'error');
        } finally {
            this.ocultarModalEliminar();
        }
    }
    
    ocultarModalEliminar() {
        this.egresadoIdToDelete = null;
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }
    
    actualizarEstadisticas(total) {
        const stats = document.getElementById('total-egresados');
        if (stats) {
            stats.textContent = `Total: ${total}`;
        }
    }
    
    mostrarLoading(mostrar) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = mostrar ? 'block' : 'none';
        }
    }
    
    mostrarNotificacion(mensaje, tipo) {
        console.log(`Notificación [${tipo}]:`, mensaje);
        
        let notification = document.getElementById('notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 3000;
                display: none;
                animation: slideIn 0.3s ease;
                max-width: 350px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(notification);
        }
        
        notification.textContent = mensaje;
        
        // Estilos según tipo
        if (tipo === 'success') {
            notification.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
            notification.style.borderLeft = '4px solid #219653';
        } else if (tipo === 'error') {
            notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            notification.style.borderLeft = '4px solid #d63031';
        } else {
            notification.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
            notification.style.borderLeft = '4px solid #0984e3';
        }
        
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    buscarEgresados(termino) {
        const busqueda = termino.toLowerCase().trim();
        this.lastSearchTerm = busqueda;
        
        if (!busqueda) {
            this.renderizarEgresados(this.allEgresados);
            this.actualizarEstadisticas(this.allEgresados.length);
            return;
        }
        
        const resultados = this.allEgresados.filter(egresado => {
            const matricula = egresado.matricula || '';
            const nombreCompleto = egresado.nombre_completo || egresado.nombreCompleto || egresado.nombre || '';
            const carrera = egresado.carrera || '';
            const generacion = egresado.generacion || '';
            const estatus = egresado.estatus || '';
            const correo = egresado.correo || '';
            
            const textoBusqueda = `
                ${matricula}
                ${nombreCompleto}
                ${carrera}
                ${generacion}
                ${estatus}
                ${correo}
            `.toLowerCase();
            
            return textoBusqueda.includes(busqueda);
        });
        
        this.filteredEgresados = resultados;
        this.renderizarEgresados(resultados);
        
        const stats = document.getElementById('total-egresados');
        if (stats && busqueda) {
            stats.textContent = `Encontrados: ${resultados.length} de ${this.allEgresados.length}`;
        }
    }
    
    setupEventListeners() {
        // Formulario
        const form = document.getElementById('egresado-form');
        if (form) {
            form.addEventListener('submit', (e) => this.guardarEgresado(e));
        }
        
        // Botón cancelar
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelarEdicion());
        }
        
        // Búsqueda
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.buscarEgresados(e.target.value));
        }
        
        // Modal eliminar
        const confirmDelete = document.getElementById('confirm-delete');
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.eliminarEgresado());
        }
        
        const cancelDelete = document.getElementById('cancel-delete');
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.ocultarModalEliminar());
        }
        
        // Cerrar modal haciendo clic fuera
        const deleteModal = document.getElementById('delete-modal');
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target.id === 'delete-modal') {
                    this.ocultarModalEliminar();
                }
            });
        }
        
        // Botón de datos de ejemplo (solo para desarrollo local)
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            const exampleBtn = document.createElement('button');
            exampleBtn.id = 'example-btn';
            exampleBtn.className = 'btn btn-secondary';
            exampleBtn.innerHTML = '<i class="fas fa-magic"></i> Datos Ejemplo';
            exampleBtn.addEventListener('click', () => this.cargarDatosEjemplo());
            
            const formButtons = document.querySelector('.form-buttons');
            if (formButtons) {
                formButtons.appendChild(exampleBtn);
            }
        }
    }
    
    cargarDatosEjemplo() {
        const datosEjemplo = {
            matricula: '20230001',
            nombreCompleto: 'Juan Pérez González',
            carrera: 'Ingeniería en Sistemas Computacionales',
            generacion: '2019-2023',
            estatus: 'Titulado',
            domicilio: 'Calle Principal #123, Ciudad de México, CDMX',
            genero: 'Masculino',
            telefono: '5512345678',
            correo: 'juan.perez@email.com'
        };
        
        Object.keys(datosEjemplo).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = datosEjemplo[key];
            }
        });
        
        this.mostrarNotificacion('Datos de ejemplo cargados', 'success');
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ControlEgresados();
});