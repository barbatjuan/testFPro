// Configuración para la salida de métricas de k6 hacia InfluxDB
// Este archivo se importa en los tests de k6 para habilitar la exportación de métricas

/**
 * Configura el objeto de opciones de k6 para incluir la salida de métricas a InfluxDB
 * 
 * @param {Object} baseOptions - Configuración base de k6
 * @returns {Object} - Configuración extendida con la salida a InfluxDB
 */
export function withInfluxDBOutput(baseOptions) {
  return {
    ...baseOptions,
    // Mantener todas las opciones existentes (VUs, duración, thresholds, etc.)
    
    // Añadir la configuración para la salida a InfluxDB
    // Solo se activará cuando se ejecute k6 con la variable K6_INFLUXDB_OUTPUT=true
    ext: {
      ...(baseOptions.ext || {}),
      loadimpact: {
        ...(baseOptions.ext?.loadimpact || {}),
        // Esta sección es para k6 cloud, si se usa
      }
    }
  };
}

// Notas para configurar la salida a InfluxDB:
// 
// 1. Este archivo no modifica directamente la configuración, solo prepara el objeto.
// 2. Al ejecutar k6, debes especificar los argumentos:
//    k6 run -o influxdb=http://localhost:8086/k6 tu_test.js
//
// 3. Para activarlo en el script run-tests.sh, modifica la línea:
//    dotenv -- k6 run $test_file
//    a:
//    dotenv -- k6 run -o influxdb=http://localhost:8086/k6 $test_file
//
// 4. O puedes usar una variable de entorno para alternar entre modos:
//    if [ "$MONITORING" == "true" ]; then
//      dotenv -- k6 run -o influxdb=http://localhost:8086/k6 $test_file
//    else
//      dotenv -- k6 run $test_file
//    fi
