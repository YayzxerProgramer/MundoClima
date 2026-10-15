Las funcionalidades mock de Fase 2 quedan pendientes por alcance.
La aplicación de Fase 1 consume la API real. Los datos aislados para verificar
el frontend están en `tests/fixtures.ts`; se interceptan solamente en Playwright
y no se importan en la aplicación ni sustituyen silenciosamente al backend.
