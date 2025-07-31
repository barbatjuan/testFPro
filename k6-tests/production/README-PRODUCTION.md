# ⚠️ ATENCIÓN: SCRIPTS DE PRODUCCIÓN ⚠️

## 🚨 ADVERTENCIA CRÍTICA 🚨

**ESTOS SCRIPTS EJECUTAN PRUEBAS EN EL ENTORNO DE PRODUCCIÓN REAL**

### Antes de ejecutar cualquier script:

1. ✅ Confirma que tienes autorización del equipo
2. ✅ Verifica que es un horario de bajo tráfico
3. ✅ Asegúrate de tener un plan de contingencia
4. ✅ Notifica al equipo de desarrollo/operaciones

### Scripts disponibles:

- `factupro-production-simple.js` - Prueba básica de tiempos de respuesta (solo GET)

### Cómo ejecutar:

```bash
# SOLO después de confirmar todos los puntos anteriores
k6 run production/factupro-production-simple.js
```

### En caso de problemas:

1. Detén inmediatamente la prueba (Ctrl+C)
2. Notifica al equipo de operaciones
3. Documenta el incidente

---

**RECUERDA: ESTÁS TRABAJANDO CON DATOS REALES DE PRODUCCIÓN**
