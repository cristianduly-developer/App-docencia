# Aye · Maestra Integradora

App de trabajo diario para Maestra de Educacion Especial.

## Estructura del proyecto

```
aye-app/
├── server.js          # Servidor Express (proxy seguro para Claude API)
├── package.json       # Dependencias
├── vercel.json        # Configuracion de deploy en Vercel
└── public/
    ├── index.html     # App principal (mapa, fichas, registros, copilot)
    ├── config.html    # Panel de configuracion (escuelas, docentes, alumnos)
    ├── docs.html      # Documentos oficiales (PPI, informes)
    ├── manifest.json  # PWA - para instalar en el celular
    └── sw.js          # Service Worker - funciona sin conexion
```

## Deploy en Vercel (paso a paso)

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. En la carpeta del proyecto
```bash
cd aye-app
npm install
vercel login
vercel
```

### 3. Configurar la API key de Claude
En el dashboard de Vercel (vercel.com):
- Ir al proyecto → Settings → Environment Variables
- Agregar: `ANTHROPIC_API_KEY` = tu API key de Anthropic

### 4. Redesplegar
```bash
vercel --prod
```

## Instalar como app en el celular

Una vez deployada en Vercel:
- **Android**: Abrir en Chrome → menu (tres puntos) → "Agregar a pantalla de inicio"
- **iPhone**: Abrir en Safari → boton compartir → "Agregar a pantalla de inicio"

## Modulos

| URL | Modulo | Uso |
|-----|--------|-----|
| `/` | App principal | Uso diario: mapa, registros, directorio, copilot |
| `/config` | Configuracion | Inicio de año: escuelas, docentes, alumnos, EOE |
| `/docs` | Documentos | 3 veces/año: PPI, informes, calificaciones |

## Variables de entorno necesarias

| Variable | Descripcion |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key de Anthropic (console.anthropic.com) |

## Tecnologias

- **Frontend**: React 18 + Babel (sin bundler, carga desde CDN)
- **Backend**: Express.js (proxy para API de Claude)
- **IA**: Claude Sonnet (Anthropic)
- **Deploy**: Vercel
- **Storage**: localStorage (migrar a Firebase en proxima version)
