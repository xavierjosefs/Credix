## Despliegue en Vercel

Este backend se despliega como una funcion de Vercel usando `api/index.ts`.

### Root Directory

Usa:

```bash
backend
```

### Variables de entorno necesarias

```bash
DATABASE_URL=postgres://usuario:password@host:5432/database
JWT_SECRET=tu_jwt_secret
ENCRYPTION_KEY=12345678901234567890123456789012
FRONTEND_URL=https://tu-frontend.vercel.app
ALLOWED_ORIGINS=https://tu-frontend.vercel.app
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASSWORD=tu-app-password
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Notas

- `FRONTEND_URL` se usa para los enlaces de completar registro de administradores.
- `ALLOWED_ORIGINS` acepta varios dominios separados por coma.
- El backend tambien permite subdominios `.vercel.app` para previews.
- `SUPABASE_SERVICE_ROLE_KEY` es la recomendada para subida de imagenes desde el backend.

### Rutas utiles

- `GET /` responde estado del servicio
- `GET /health` responde estado del servicio
