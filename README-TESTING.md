# Pruebas Automatizadas - SwapWeb

Este documento explica cómo ejecutar las tres tipos de pruebas automatizadas del proyecto SwapWeb.

## Tipos de Pruebas

### 1. **Pruebas Unitarias** (Backend)
- **Qué prueban**: Funciones individuales como validación de email, generación de tokens, comparación de contraseñas
- **Herramientas**: Mocha, Chai
- **Ubicación**: `backend/tests/unit.test.js`

### 2. **Pruebas de Integración** (Backend)
- **Qué prueban**: Endpoints de la API como login, registro, productos
- **Herramientas**: Mocha, Chai, Supertest
- **Ubicación**: `backend/tests/integration.test.js`

### 3. **Pruebas E2E** (Frontend)
- **Qué prueban**: Navegación completa como usuario real
- **Herramientas**: Cypress
- **Ubicación**: `Frontend/cypress/e2e/`

## 🚀 Cómo Ejecutar las Pruebas

### Pruebas Unitarias
```bash
cd backend
npm test unit.test.js
```

### Pruebas de Integración
```bash
cd backend
npm test integration.test.js
```

### Pruebas E2E
```bash
cd Frontend
npm run cypress:open
```

## 📊 Cobertura de Código
```bash
cd backend
npm run coverage
```

## 🎯 Explicación para el Profesor

### Pruebas Unitarias (5 pruebas)
1. **Validación de Email**: Verifica que la función `validarEmail` funcione correctamente
2. **Generación de Token JWT**: Prueba la creación y verificación de tokens
3. **Extracción de Token**: Verifica cómo se extrae el token del header HTTP
4. **Comparación de Contraseñas**: Prueba la comparación básica de contraseñas
5. **Validación de Campos**: Verifica que los campos no estén vacíos

### Pruebas de Integración (5 pruebas)
1. **Registro de Usuario**: Prueba el endpoint `/api/users/register`
2. **Login de Usuario**: Prueba el endpoint `/api/users/login`
3. **Rutas Protegidas**: Verifica que las rutas requieran autenticación
4. **Gestión de Productos**: Prueba los endpoints de productos
5. **Búsqueda de Usuario**: Prueba obtener usuario por ID

### Pruebas E2E (5 pruebas)
1. **Navegación Principal**: Verifica que la página principal cargue
2. **Acceso a Login**: Prueba la navegación al formulario de login
3. **Acceso a Registro**: Prueba la navegación al formulario de registro
4. **Restricciones sin Login**: Verifica que ciertas páginas requieran autenticación
5. **Navegación entre Páginas**: Prueba la navegación completa

## 💡 Conceptos Clave

- **Unitarias**: Prueban funciones pequeñas y específicas
- **Integración**: Prueban cómo funcionan los endpoints de la API
- **E2E**: Simulan el uso real de la aplicación desde el navegador

Cada tipo de prueba tiene su propósito y complementa a las otras para asegurar que la aplicación funcione correctamente. 