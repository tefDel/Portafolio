# Portafolio de Estefanía Restrepo 

Sitio estático hecho con HTML, CSS y JavaScript. No necesita instalar dependencias ni compilarse.

## Ejecutar en local

Requiere Node.js 18 o posterior. Desde esta carpeta, ejecuta:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para detener el servidor, pulsa `Ctrl+C`.

Las páginas y sus estilos están en `public/portfolio`; el servidor local de `server.js` las publica y redirige la página principal a esa carpeta.

Guarda los videos e imágenes dentro de `public/assets` y enlázalos desde las páginas de proyecto con rutas como `../../../assets/nombre-del-archivo.mp4` o `../../../assets/nombre-de-imagen.jpg`. El servidor local asigna el MIME de video y admite solicitudes parciales para que los videos MP4 puedan cargar y avanzar.
