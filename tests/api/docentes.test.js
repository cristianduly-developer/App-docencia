import { test, expect } from '@playwright/test'

const BASE = 'https://docentes.solucionesmdp.com.ar'
const SAAS = 'https://saas.solucionesmdp.com.ar'
// Docentes usa Google OAuth + sesión propia (x-session-token), no Bearer JWT
// Los tests con sesión requieren pasar por el flujo Google completo

// ─── VERIFY TOKEN ────────────────────────────────────────────────────
test.describe('verify-token', () => {
  test('sin body retorna 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/verify-token`, { data: {} })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  test('credential inválida retorna 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/verify-token`, {
      data: { credential: 'google_token_falso_123' }
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  test('rate limit activo — no devuelve 5xx en múltiples intentos', async ({ request }) => {
    for (let i = 0; i < 3; i++) {
      const res = await request.post(`${BASE}/api/verify-token`, {
        data: { credential: 'token_invalido' }
      })
      expect(res.status()).toBeLessThan(500)
    }
  })
})

// ─── PLANES Y PRECIOS ───────────────────────────────────────────────
test.describe('planes-precios', () => {
  test('es pública y retorna planes', async ({ request }) => {
    const res = await request.get(`${BASE}/api/planes-precios`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const planes = Array.isArray(body) ? body : body.planes
    expect(Array.isArray(planes)).toBe(true)
    expect(planes.length).toBeGreaterThan(0)
  })

  test('cada plan tiene nombre y precio', async ({ request }) => {
    const res = await request.get(`${BASE}/api/planes-precios`)
    const body = await res.json()
    const planes = Array.isArray(body) ? body : body.planes
    for (const plan of planes) {
      expect(plan).toHaveProperty('plan')
      expect(plan).toHaveProperty('precio_mensual')
    }
  })

  test('existe plan básico $25000', async ({ request }) => {
    const res = await request.get(`${BASE}/api/planes-precios`)
    const body = await res.json()
    const planes = Array.isArray(body) ? body : body.planes
    const basico = planes.find(p => p.plan === 'basico')
    expect(basico).toBeTruthy()
    expect(basico.precio_mensual).toBe(25000)
  })

  test('existe plan profesional $35000', async ({ request }) => {
    const res = await request.get(`${BASE}/api/planes-precios`)
    const body = await res.json()
    const planes = Array.isArray(body) ? body : body.planes
    const prof = planes.find(p => p.plan === 'profesional')
    expect(prof).toBeTruthy()
    expect(prof.precio_mensual).toBe(35000)
  })

  test('existe plan premium $50000', async ({ request }) => {
    const res = await request.get(`${BASE}/api/planes-precios`)
    const body = await res.json()
    const planes = Array.isArray(body) ? body : body.planes
    const prem = planes.find(p => p.plan === 'premium')
    expect(prem).toBeTruthy()
    expect(prem.precio_mensual).toBe(50000)
  })
})

// ─── RUTAS PROTEGIDAS (requireAuth → x-session-token) ───────────────
test.describe('rutas protegidas sin sesión', () => {
  test('health sin sesión → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(401)
  })

  test('db/alumnos sin sesión → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/db/alumnos`)
    expect(res.status()).toBe(401)
  })

  test('db/registros sin sesión → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/db/registros`)
    expect(res.status()).toBe(401)
  })

  test('db/escuelas sin sesión → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/db/escuelas`)
    expect(res.status()).toBe(401)
  })

  test('presencia sin sesión → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/presencia`)
    expect(res.status()).toBe(401)
  })

  test('mp-crear-suscripcion sin sesión → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/mp-crear-suscripcion`, {
      data: { plan: 'profesional' }
    })
    expect(res.status()).toBe(401)
  })

  test('mp-cancelar-suscripcion sin sesión → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/mp-cancelar-suscripcion`)
    expect(res.status()).toBe(401)
  })

  test('sesión inválida es rechazada → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`, {
      headers: { 'x-session-token': 'sesion_falsa_abc123' }
    })
    expect(res.status()).toBe(401)
  })
})

// ─── MP PAGO PÚBLICO ────────────────────────────────────────────────
test.describe('mp-pago-publico', () => {
  test('sin datos retorna error controlado', async ({ request }) => {
    const res = await request.post(`${BASE}/api/mp-pago-publico`, { data: {} })
    expect(res.status()).toBeLessThan(500)
  })
})

// ─── REGISTRAR DEMO ─────────────────────────────────────────────────
test.describe('registrar-demo', () => {
  test('sin datos retorna error controlado', async ({ request }) => {
    const res = await request.post(`${BASE}/api/registrar-demo`, { data: {} })
    expect(res.status()).toBeLessThan(500)
  })
})

// ─── SET ACCESS ─────────────────────────────────────────────────────
test.describe('set-access', () => {
  test('sin x-app-key retorna error controlado', async ({ request }) => {
    const res = await request.post(`${BASE}/api/set-access`, {
      data: { plan: 'basico' }
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
})

// ─── REPORTAR ERROR (SaaS) ──────────────────────────────────────────
test.describe('reportar-error (SaaS)', () => {
  test('acepta errores de app docentes sin explotar', async ({ request }) => {
    const res = await request.post(`${SAAS}/api/reportar-error`, {
      headers: { 'x-app-id': 'docentes', 'x-app-key': 'clave_invalida' },
      data: { mensaje: 'Test E2E docentes', nivel: 'info' }
    })
    expect(res.status()).toBeLessThan(500)
  })
})
