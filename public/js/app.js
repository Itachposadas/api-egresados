class ControlEgresados {
    constructor() {
        this.API_URL = window.location.hostname === 'localhost' 
            ? 'https://api-egresados.onrender.com/api/egresados' 
            : '/api/egresados';
        
        this.egresadoIdToDelete = null;
        this.currentEditId = null;
        
        this.init();
    }
    
    init() {
        this.cargarEgresados();
        this.setupEventListeners();
        
        // Configurar botón de ejemplo solo en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const exampleBtn = document.getElementById('example-btn');
            if (exampleBtn) {
                exampleBtn.style.display = 'inline-flex';
                exampleBtn.addEventListener('click', () => this.cargarDatosEjemplo());
            }
        }
    }
    
    async cargarEgresados() {
        try {
            this.mostrarLoading(true);
            const response = await fetch(this.API_URL);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const egresados = await response.json();
            
            this.renderizarEgresados(egresados);
            this.actualizarEstadisticas(egresados.length);
            
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
        
        if (!egresados || egresados.length === 0) {
            tbody.innerHTML = '';
            if (noData) noData.style.display = 'block';
            return;
        }
        
        if (noData) noData.style.display = 'none';
        
        tbody.innerHTML = egresados.map(egresado => `
            <tr data-id="${egresado._id}">
                <td>${egresado.nombre} ${egresado.apellido}</td>
                <td>${egresado.cedula}</td>
                <td>${egresado.carrera}</td>
                <td>${egresado.anoGraduacion}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit" data-id="${egresado._id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-delete" data-id="${egresado._id}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Agregar event listeners a los botones recién creados
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
        
        // Validaciones básicas
        const errores = this.validarFormulario();
        if (errores.length > 0) {
            this.mostrarNotificacion(errores[0], 'error');
            return;
        }
        
        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            cedula: document.getElementById('cedula').value.trim(),
            carrera: document.getElementById('carrera').value,
            anoGraduacion: parseInt(document.getElementById('anoGraduacion').value),
            correo: document.getElementById('correo').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            empresaActual: document.getElementById('empresaActual').value.trim(),
            puesto: document.getElementById('puesto').value.trim()
        };
        
        try {
            let response;
            
            if (this.currentEditId) {
                // Actualizar
                response = await fetch(`${this.API_URL}/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al actualizar');
                }
                
                this.mostrarNotificacion('Egresado actualizado correctamente', 'success');
            } else {
                // Crear nuevo
                response = await fetch(this.API_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al crear');
                }
                
                this.mostrarNotificacion('Egresado agregado correctamente', 'success');
            }
            
            this.limpiarFormulario();
            this.cargarEgresados();
            
        } catch (error) {
            console.error('Error guardando egresado:', error);
            this.mostrarNotificacion(error.message || 'Error al guardar egresado', 'error');
        }
    }
    
    validarFormulario() {
        const errores = [];
        const nombre = document.getElementById('nombre').value.trim();
        const cedula = document.getElementById('cedula').value.trim();
        const correo = document.getElementById('correo').value.trim();
        const anoGraduacion = parseInt(document.getElementById('anoGraduacion').value);
        const carrera = document.getElementById('carrera').value;
        
        if (!nombre || nombre.length < 2) {
            errores.push('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!cedula || !/^\d+$/.test(cedula)) {
            errores.push('La cédula debe contener solo números');
        }
        
        if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            errores.push('Ingrese un correo electrónico válido');
        }
        
        if (!carrera) {
            errores.push('Seleccione una carrera');
        }
        
        const anioActual = new Date().getFullYear();
        if (!anoGraduacion || anoGraduacion < 2000 || anoGraduacion > anioActual) {
            errores.push(`El año de graduación debe estar entre 2000 y ${anioActual}`);
        }
        
        return errores;
    }
    
    async editarEgresado(id) {
        try {
            this.mostrarLoading(true);
            const response = await fetch(`${this.API_URL}/${id}`);
            
            if (!response.ok) {
                throw new Error('Error al obtener datos');
            }
            
            const egresado = await response.json();
            
            // Llenar formulario con datos
            document.getElementById('egresado-id').value = egresado._id;
            document.getElementById('nombre').value = egresado.nombre;
            document.getElementById('apellido').value = egresado.apellido;
            document.getElementById('cedula').value = egresado.cedula;
            document.getElementById('correo').value = egresado.correo;
            document.getElementById('carrera').value = egresado.carrera;
            document.getElementById('anoGraduacion').value = egresado.anoGraduacion;
            document.getElementById('telefono').value = egresado.telefono || '';
            document.getElementById('empresaActual').value = egresado.empresaActual || '';
            document.getElementById('puesto').value = egresado.puesto || '';
            
            // Cambiar título del formulario
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
            modal.style.display = 'flex';
        }
    }
    
    async eliminarEgresado() {
        if (!this.egresadoIdToDelete) return;
        
        try {
            const response = await fetch(`${this.API_URL}/${this.egresadoIdToDelete}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Error al eliminar');
            }
            
            this.mostrarNotificacion('Egresado eliminado correctamente', 'success');
            this.cargarEgresados();
            
        } catch (error) {
            console.error('Error eliminando egresado:', error);
            this.mostrarNotificacion('Error al eliminar egresado', 'error');
        } finally {
            this.ocultarModalEliminar();
        }
    }
    
    ocultarModalEliminar() {
        this.egresadoIdToDelete = null;
        const modal = document.getElementById('delete-modal');
        if (modal) {
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
        const notification = document.getElementById('notification');
        if (!notification) {
            console.error('No se encontró el elemento de notificación');
            return;
        }
        
        notification.textContent = mensaje;
        notification.className = `notification ${tipo}`;
        notification.style.display = 'block';
        
        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
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
        
        // Botón exportar
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportarDatos());
        }
    }
    
    buscarEgresados(termino) {
        const filas = document.querySelectorAll('#egresados-body tr');
        const busqueda = termino.toLowerCase().trim();
        
        if (!busqueda) {
            filas.forEach(fila => {
                fila.style.display = '';
            });
            return;
        }
        
        let encontrados = 0;
        filas.forEach(fila => {
            const textoFila = fila.textContent.toLowerCase();
            if (textoFila.includes(busqueda)) {
                fila.style.display = '';
                encontrados++;
            } else {
                fila.style.display = 'none';
            }
        });
        
        // Actualizar contador de búsqueda
        if (busqueda) {
            const stats = document.getElementById('total-egresados');
            if (stats) {
                const total = document.querySelectorAll('#egresados-body tr').length;
                stats.textContent = `Encontrados: ${encontrados} de ${total}`;
            }
        }
    }
    
    async exportarDatos() {
        try {
            this.mostrarLoading(true);
            const response = await fetch(this.API_URL);
            
            if (!response.ok) {
                throw new Error('Error al obtener datos para exportar');
            }
            
            const egresados = await response.json();
            
            if (!egresados || egresados.length === 0) {
                this.mostrarNotificacion('No hay datos para exportar', 'error');
                return;
            }
            
            // Crear CSV
            let csv = 'Nombre,Apellido,Cédula,Carrera,Año Graduación,Correo,Teléfono,Empresa,Puesto\n';
            
            egresados.forEach(egresado => {
                csv += `"${egresado.nombre || ''}","${egresado.apellido || ''}","${egresado.cedula || ''}","${egresado.carrera || ''}",`;
                csv += `"${egresado.anoGraduacion || ''}","${egresado.correo || ''}","${egresado.telefono || ''}","${egresado.empresaActual || ''}","${egresado.puesto || ''}"\n`;
            });
            
            // Descargar archivo
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `egresados_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.mostrarNotificacion('Datos exportados correctamente', 'success');
            
        } catch (error) {
            console.error('Error exportando datos:', error);
            this.mostrarNotificacion('Error al exportar datos', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    cargarDatosEjemplo() {
        const datosEjemplo = {
            nombre: 'Juan',
            apellido: 'Pérez',
            cedula: '12345678',
            carrera: 'Ingeniería de Sistemas',
            anoGraduacion: 2020,
            correo: 'juan.perez@email.com',
            telefono: '3001234567',
            empresaActual: 'Tech Corp',
            puesto: 'Desarrollador Senior'
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

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ControlEgresados();
});