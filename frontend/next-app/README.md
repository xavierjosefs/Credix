This is the frontend for Gestor de Prestamos, built with [Next.js](https://nextjs.org).

## Desarrollo

Instala dependencias y levanta el frontend:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Por defecto el frontend espera el backend en `http://localhost:8000`.

Si quieres cambiarlo, crea un archivo `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Despliegue en Vercel

Para desplegar este frontend en Vercel:

1. Usa `frontend/next-app` como Root Directory del proyecto.
2. Configura esta variable de entorno en Vercel:

```bash
NEXT_PUBLIC_API_BASE_URL=https://TU-BACKEND-PUBLICO
```

3. Asegurate de que tu backend permita CORS desde el dominio de Vercel.
4. Ejecuta el despliegue normal de Next.js.

## Nota importante

Este proyecto no puede consumir `localhost` una vez desplegado. El backend debe estar publicado en una URL accesible desde internet y esa URL debe ir en `NEXT_PUBLIC_API_BASE_URL`.

## Build local

```bash
npm run build
```
