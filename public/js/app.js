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
        // Asegurar que el modal esté oculto al inicio
        this.ocultarModalEliminar();
        
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
                        <button class="btn btn-pdf" data-id="${egresado._id}" 
                                data-nombre="${egresado.nombre}" 
                                data-apellido="${egresado.apellido}">
                            <i class="fas fa-file-pdf"></i> PDF
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
        
        // Botones de PDF
        document.querySelectorAll('.btn-pdf').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const nombre = e.currentTarget.getAttribute('data-nombre');
                const apellido = e.currentTarget.getAttribute('data-apellido');
                await this.generarPDFIndividual(id, nombre, apellido);
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
    
    buscarEgresados(termino) {
        const filas = document.querySelectorAll('#egresados-body tr');
        const busqueda = termino.toLowerCase().trim();
        this.lastSearchTerm = busqueda;
        this.filteredEgresados = [];
        
        if (!busqueda) {
            filas.forEach(fila => {
                fila.style.display = '';
            });
            // Ocultar botón de exportar filtrados
            const exportFilteredBtn = document.getElementById('export-filtered-btn');
            if (exportFilteredBtn) {
                exportFilteredBtn.style.display = 'none';
            }
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
        
        // Mostrar/ocultar botón de exportar filtrados
        const exportFilteredBtn = document.getElementById('export-filtered-btn');
        if (exportFilteredBtn) {
            if (encontrados > 0) {
                exportFilteredBtn.style.display = 'inline-flex';
                exportFilteredBtn.innerHTML = `<i class="fas fa-filter"></i> Exportar Filtrados (${encontrados})`;
            } else {
                exportFilteredBtn.style.display = 'none';
            }
        }
        
        // Actualizar contador de búsqueda
        const stats = document.getElementById('total-egresados');
        if (stats && busqueda) {
            stats.textContent = `Encontrados: ${encontrados} de ${this.allEgresados.length}`;
        }
    }
    
    // ===== MÉTODOS DE EXPORTACIÓN =====
    
    // 1. Exportar TODOS los egresados (CSV)
    async exportarTodosCSV() {
        try {
            this.mostrarLoading(true);
            
            if (!this.allEgresados || this.allEgresados.length === 0) {
                this.mostrarNotificacion('No hay datos para exportar', 'error');
                return;
            }
            
            // Crear CSV
            let csv = 'Nombre,Apellido,Cédula,Carrera,Año Graduación,Correo,Teléfono,Empresa,Puesto,Fecha Registro\n';
            
            this.allEgresados.forEach(egresado => {
                csv += `"${egresado.nombre || ''}","${egresado.apellido || ''}","${egresado.cedula || ''}","${egresado.carrera || ''}",`;
                csv += `"${egresado.anoGraduacion || ''}","${egresado.correo || ''}","${egresado.telefono || ''}","${egresado.empresaActual || ''}","${egresado.puesto || ''}",`;
                csv += `"${new Date(egresado.fechaCreacion || egresado.createdAt).toLocaleDateString('es-ES')}"\n`;
            });
            
            // Descargar archivo
            this.descargarCSV(csv, 'todos_egresados');
            this.mostrarNotificacion(`${this.allEgresados.length} egresados exportados correctamente`, 'success');
            
        } catch (error) {
            console.error('Error exportando datos:', error);
            this.mostrarNotificacion('Error al exportar datos', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    // 2. Exportar solo los egresados FILTRADOS (CSV)
    async exportarFiltradosCSV() {
        if (this.filteredEgresados.length === 0) {
            this.mostrarNotificacion('No hay egresados filtrados para exportar', 'warning');
            return;
        }
        
        try {
            this.mostrarLoading(true);
            
            // Crear CSV con datos filtrados
            let csv = 'Nombre,Apellido,Cédula,Carrera,Año Graduación,Correo,Teléfono,Empresa,Puesto,Fecha Registro\n';
            
            this.filteredEgresados.forEach(egresado => {
                csv += `"${egresado.nombre || ''}","${egresado.apellido || ''}","${egresado.cedula || ''}","${egresado.carrera || ''}",`;
                csv += `"${egresado.anoGraduacion || ''}","${egresado.correo || ''}","${egresado.telefono || ''}","${egresado.empresaActual || ''}","${egresado.puesto || ''}",`;
                csv += `"${new Date(egresado.fechaCreacion || egresado.createdAt).toLocaleDateString('es-ES')}"\n`;
            });
            
            // Descargar archivo
            const termino = this.lastSearchTerm.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
            this.descargarCSV(csv, `filtrados_${termino || 'busqueda'}`);
            this.mostrarNotificacion(`${this.filteredEgresados.length} egresados filtrados exportados`, 'success');
            
        } catch (error) {
            console.error('Error exportando filtrados:', error);
            this.mostrarNotificacion('Error al exportar filtrados', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    // 3. Exportar PDF INDIVIDUAL
    async generarPDFIndividual(id, nombre, apellido) {
        try {
            this.mostrarLoading(true);
            
            // Obtener datos del egresado
            const response = await fetch(`${this.API_URL}/${id}`);
            if (!response.ok) throw new Error('Error al obtener datos del egresado');
            
            const egresado = await response.json();
            
            // Crear contenido HTML para el PDF
            const fecha = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const contenidoHTML = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Ficha de Egresado - ${egresado.nombre} ${egresado.apellido}</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', Arial, sans-serif; 
                            margin: 0;
                            padding: 20px;
                            color: #333;
                            line-height: 1.6;
                        }
                        .container {
                            max-width: 800px;
                            margin: 0 auto;
                            border: 2px solid #2c3e50;
                            border-radius: 10px;
                            padding: 30px;
                            background: white;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 3px solid #3498db;
                        }
                        .header h1 {
                            color: #2c3e50;
                            margin: 0 0 10px 0;
                            font-size: 24px;
                        }
                        .header h2 {
                            color: #3498db;
                            margin: 0;
                            font-size: 20px;
                            font-weight: normal;
                        }
                        .section {
                            margin-bottom: 25px;
                        }
                        .section-title {
                            background: #2c3e50;
                            color: white;
                            padding: 10px 15px;
                            border-radius: 5px;
                            margin-bottom: 15px;
                            font-size: 16px;
                            font-weight: bold;
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: 1fr 2fr;
                            gap: 10px;
                        }
                        .info-item {
                            margin-bottom: 12px;
                        }
                        .label {
                            font-weight: bold;
                            color: #555;
                        }
                        .value {
                            color: #333;
                        }
                        .footer {
                            margin-top: 40px;
                            text-align: center;
                            color: #7f8c8d;
                            font-size: 12px;
                            border-top: 1px solid #eee;
                            padding-top: 20px;
                        }
                        .qr-placeholder {
                            text-align: center;
                            margin: 30px 0;
                            padding: 20px;
                            background: #f8f9fa;
                            border-radius: 8px;
                            border: 1px dashed #ddd;
                        }
                        .id-verification {
                            font-family: monospace;
                            background: #f8f9fa;
                            padding: 8px 12px;
                            border-radius: 4px;
                            display: inline-block;
                            margin-top: 10px;
                            font-size: 12px;
                        }
                        @media print {
                            body { 
                                padding: 0; 
                                font-size: 11pt;
                            }
                            .container {
                                border: none;
                                padding: 15px;
                            }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>UNIVERSIDAD MANUELA BELTRÁN</h1>
                            <h2>Sistema de Control de Egresados</h2>
                            <p style="color: #7f8c8d; margin-top: 10px;">
                                Ficha de Egresado - Generada el ${fecha}
                            </p>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">INFORMACIÓN PERSONAL</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="label">Nombre completo:</div>
                                    <div class="value">${egresado.nombre} ${egresado.apellido}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Cédula:</div>
                                    <div class="value">${egresado.cedula}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Correo electrónico:</div>
                                    <div class="value">${egresado.correo}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Teléfono:</div>
                                    <div class="value">${egresado.telefono || 'No registrado'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">INFORMACIÓN ACADÉMICA</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="label">Carrera:</div>
                                    <div class="value">${egresado.carrera}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Año de graduación:</div>
                                    <div class="value">${egresado.anoGraduacion}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Fecha de registro:</div>
                                    <div class="value">${new Date(egresado.fechaCreacion || egresado.createdAt).toLocaleDateString('es-ES')}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">INFORMACIÓN LABORAL</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="label">Empresa actual:</div>
                                    <div class="value">${egresado.empresaActual || 'No registrada'}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Puesto:</div>
                                    <div class="value">${egresado.puesto || 'No registrado'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="qr-placeholder">
                            <p style="margin: 0; color: #666;">
                                <strong>Código de verificación del egresado:</strong>
                            </p>
                            <div class="id-verification">ID: ${egresado._id}</div>
                            <p style="margin-top: 15px; font-size: 11px; color: #888;">
                                Este código puede ser utilizado para verificar la autenticidad de este documento
                            </p>
                        </div>
                        
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Universidad Manuela Beltrán</p>
                            <p>Este documento es generado automáticamente por el Sistema de Control de Egresados</p>
                            <p>Documento válido únicamente para fines administrativos</p>
                        </div>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            📄 Imprimir / Guardar como PDF
                        </button>
                        <button onclick="window.close()" style="
                            background: #e74c3c;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                            margin-left: 10px;
                        ">
                            ✕ Cerrar
                        </button>
                    </div>
                </body>
                </html>
            `;
            
            // Abrir en nueva ventana para imprimir
            this.abrirVentanaPDF(contenidoHTML, `${egresado.nombre}_${egresado.apellido}`);
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            this.mostrarNotificacion('Error al generar PDF', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    abrirVentanaPDF(contenidoHTML, nombreArchivo) {
        const ventana = window.open('', '_blank');
        ventana.document.write(contenidoHTML);
        ventana.document.close();
        
        // Guardar el nombre para referencia
        ventana.archivoNombre = nombreArchivo;
        
        this.mostrarNotificacion('PDF generado. Puede imprimirlo o guardarlo como PDF.', 'info');
    }
    
    descargarCSV(csv, nombreBase) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${nombreBase}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
        
        // Botón exportar TODOS
        const exportAllBtn = document.getElementById('export-all-btn');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => this.exportarTodosCSV());
        } else {
            // Si no existe el botón específico, usar el genérico
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportarTodosCSV());
            }
        }
        
        // Botón exportar FILTRADOS
        const exportFilteredBtn = document.getElementById('export-filtered-btn');
        if (exportFilteredBtn) {
            exportFilteredBtn.addEventListener('click', () => this.exportarFiltradosCSV());
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
    
    // Si no existen los botones específicos de exportación, crearlos
    const stats = document.querySelector('.stats');
    if (stats && !document.getElementById('export-all-btn')) {
        // Crear contenedor de botones de exportación
        const exportButtons = document.createElement('div');
        exportButtons.className = 'export-buttons';
        
        // Botón exportar todos
        const exportAllBtn = document.createElement('button');
        exportAllBtn.id = 'export-all-btn';
        exportAllBtn.className = 'btn btn-primary';
        exportAllBtn.innerHTML = '<i class="fas fa-download"></i> Exportar Todos (CSV)';
        exportAllBtn.onclick = () => window.app.exportarTodosCSV();
        
        // Botón exportar filtrados (inicialmente oculto)
        const exportFilteredBtn = document.createElement('button');
        exportFilteredBtn.id = 'export-filtered-btn';
        exportFilteredBtn.className = 'btn btn-secondary';
        exportFilteredBtn.style.display = 'none';
        exportFilteredBtn.innerHTML = '<i class="fas fa-filter"></i> Exportar Filtrados';
        exportFilteredBtn.onclick = () => window.app.exportarFiltradosCSV();
        
        exportButtons.appendChild(exportAllBtn);
        exportButtons.appendChild(exportFilteredBtn);
        
        // Reemplazar el botón simple si existe
        const oldExportBtn = document.getElementById('export-btn');
        if (oldExportBtn) {
            oldExportBtn.replaceWith(exportButtons);
        } else {
            stats.appendChild(exportButtons);
        }
    }
});