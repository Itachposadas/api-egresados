class ControlEgresados {
    constructor() {
        this.API_URL = window.location.hostname === 'localhost'
            ? 'https://api-egresados.onrender.com/api/egresados'
            : '/api/egresados';

        this.egresadoIdToDelete = null;
        this.currentEditId = null;
        this.lastSearchTerm = '';
        this.filteredEgresados = [];
        this.allEgresados = [];

        this.init();
    }

    init() {
        this.cargarEgresados();
        this.setupEventListeners();
        this.configurarValidacionCedula();
    }

    // Configurar validación de cédula en tiempo real
    configurarValidacionCedula() {
        const cedulaInput = document.getElementById('cedula');
        if (cedulaInput) {
            // Solo permite números
            cedulaInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                
                // Limitar a 8 caracteres
                if (e.target.value.length > 8) {
                    e.target.value = e.target.value.substring(0, 8);
                }
            });

            // Validar al perder foco
            cedulaInput.addEventListener('blur', (e) => {
                const value = e.target.value.trim();
                if (value && value.length !== 8) {
                    this.mostrarNotificacion('La cédula debe tener exactamente 8 números', 'error');
                    e.target.focus();
                }
            });
        }
    }

    async cargarEgresados() {
        try {
            this.mostrarLoading(true);
            const response = await fetch(this.API_URL);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            this.allEgresados = await response.json();

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

    mostrarModalEliminar(id) {
        this.egresadoIdToDelete = id;
        const modal = document.getElementById('delete-modal');
        if (modal) {
            // Usar classList para evitar conflicto con el !important del CSS
            modal.classList.add('active');
        }
    }

    ocultarModalEliminar() {
        this.egresadoIdToDelete = null;
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async eliminarEgresado() {
        if (!this.egresadoIdToDelete) {
            this.mostrarNotificacion('No hay egresado seleccionado para eliminar', 'error');
            return;
        }

        try {
            this.mostrarLoading(true);

            const response = await fetch(
                `${this.API_URL}/${this.egresadoIdToDelete}`,
                { 
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error del servidor:', response.status, errorText);
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            this.mostrarNotificacion('Egresado eliminado correctamente', 'success');
            this.cargarEgresados();

        } catch (error) {
            console.error('Error eliminando egresado:', error);
            this.mostrarNotificacion('Error al eliminar egresado: ' + error.message, 'error');
        } finally {
            this.ocultarModalEliminar();
            this.mostrarLoading(false);
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

        // Botones del modal de eliminar - USANDO EVENT LISTENERS DIRECTOS
        const confirmDelete = document.getElementById('confirm-delete');
        const cancelDelete = document.getElementById('cancel-delete');
        const deleteModal = document.getElementById('delete-modal');

        if (confirmDelete) {
            // Remover cualquier listener anterior y agregar uno nuevo
            const newConfirmDelete = confirmDelete.cloneNode(true);
            confirmDelete.parentNode.replaceChild(newConfirmDelete, confirmDelete);
            
            newConfirmDelete.addEventListener('click', () => {
                console.log('Botón ELIMINAR clickeado, ID:', this.egresadoIdToDelete);
                this.eliminarEgresado();
            });
        }

        if (cancelDelete) {
            // Remover cualquier listener anterior y agregar uno nuevo
            const newCancelDelete = cancelDelete.cloneNode(true);
            cancelDelete.parentNode.replaceChild(newCancelDelete, cancelDelete);
            
            newCancelDelete.addEventListener('click', () => {
                console.log('Botón CANCELAR clickeado');
                this.ocultarModalEliminar();
            });
        }

        if (deleteModal) {
            // Cerrar modal al hacer clic fuera
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    this.ocultarModalEliminar();
                }
            });
        }

        // NOTA: Se han eliminado los event listeners para los botones de exportar CSV
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

        // VALIDACIÓN MEJORADA PARA CÉDULA (EXACTAMENTE 8 NÚMEROS)
        if (!cedula || !/^\d{8}$/.test(cedula)) {
            errores.push('La cédula debe tener exactamente 8 números');
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

    buscarEgresados(termino) {
        const filas = document.querySelectorAll('#egresados-body tr');
        const busqueda = termino.toLowerCase().trim();
        this.lastSearchTerm = busqueda;
        this.filteredEgresados = [];

        if (!busqueda) {
            filas.forEach(fila => {
                fila.style.display = '';
            });
            // Restaurar contador total
            this.actualizarEstadisticas(this.allEgresados.length);
            return;
        }

        let encontrados = 0;
        filas.forEach(fila => {
            const textoFila = fila.textContent.toLowerCase();
            if (textoFila.includes(busqueda)) {
                fila.style.display = '';
                encontrados++;

                // Guardar datos del egresado filtrado
                const id = fila.getAttribute('data-id');
                const celdas = fila.querySelectorAll('td');
                if (celdas.length >= 4) {
                    const egresado = this.allEgresados.find(e => e._id === id);
                    if (egresado) {
                        this.filteredEgresados.push(egresado);
                    }
                }
            } else {
                fila.style.display = 'none';
            }
        });

        // Actualizar contador de búsqueda
        const stats = document.getElementById('total-egresados');
        if (stats && busqueda) {
            stats.textContent = `Encontrados: ${encontrados} de ${this.allEgresados.length}`;
        }
    }

    // NOTA: Se han eliminado los métodos de exportación CSV:
    // - exportarTodosCSV()
    // - exportarFiltradosCSV()
    // - descargarCSV()

    cargarDatosEjemplo() {
        const datosEjemplo = {
            nombre: 'Juan',
            apellido: 'Pérez',
            cedula: '12345678', // Exactamente 8 números
            carrera: 'Ingeniería en Sistemas Computacionales',
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
    
    // NOTA: Se ha eliminado el código que creaba los botones de exportación dinámicamente
});