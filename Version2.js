const readline = require('readline-sync');

// Clase Persona
class Persona {
    constructor(nombre, edad, genero, regimen, ingreso, nivelSisben) {
        this.nombre = nombre;
        this.edad = edad;
        this.genero = genero;
        this.regimen = regimen;
        this.ingreso = ingreso;
        this.nivelSisben = nivelSisben;
    }

    calcularDescuento(costoPrueba) {
        let descuento = 0;
        if (this.nivelSisben) {
            const tasasDescuento = { 'A': 0.10, 'B1': 0.05, 'B2': 0.02 };
            descuento = costoPrueba * (tasasDescuento[this.nivelSisben] || 0);
        }
        if (this.regimen === 'contributivo' && this.ingreso > 3900000) {
            descuento += costoPrueba * ((this.ingreso - 3900000) / 3900000) * 0.10; // 10% por cada salario minimo adicional
        }
        return descuento;
    }
}

// Clase Laboratorio
class Laboratorio {
    constructor(nombre) {
        this.nombre = nombre;
        this.pruebas = [];
    }

    agregarPrueba(prueba) {
        this.pruebas.push(prueba);
    }
}

// Clase Prueba
class Prueba {
    constructor(nombre, tipo, costo) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.costo = costo;
        this.personas = [];
    }

    agregarPersona(persona) {
        this.personas.push(persona);
    }

    calcularCostoFinal() {
        let totalCosto = 0;
        let descuentosPorSisben = {};
        for (let persona of this.personas) {
            let descuento = persona.calcularDescuento(this.costo);
            let nivelSisben = persona.nivelSisben || 'Ninguno';
            descuentosPorSisben[nivelSisben] = (descuentosPorSisben[nivelSisben] || 0) + descuento;
            totalCosto += this.costo - descuento;
        }
        return { totalCosto, descuentosPorSisben };
    }
}

// Clase Farmaceutica
class Farmaceutica {
    constructor() {
        this.laboratorios = [];
    }

    agregarLaboratorio(laboratorio) {
        this.laboratorios.push(laboratorio);
    }

    calcularIngresosTotales() {
        let ingresosTotales = 0;
        let ingresosPorRegimen = { contributivo: 0, subsidiado: 0 };
        let ingresosPorTipoExamen = {};
        let descuentosPorSisben = 0;
        let totalIngresosLaboratorio = 0;
        let laboratoriosPorDebajo = [];
        let laboratoriosPorEncima = [];

        for (let laboratorio of this.laboratorios) {
            for (let prueba of laboratorio.pruebas) {
                let resultado = prueba.calcularCostoFinal();
                ingresosTotales += resultado.totalCosto;
                totalIngresosLaboratorio += resultado.totalCosto;

                prueba.personas.forEach(persona => {
                    ingresosPorRegimen[persona.regimen] += prueba.costo - persona.calcularDescuento(prueba.costo);
                });

                ingresosPorTipoExamen[prueba.tipo] = (ingresosPorTipoExamen[prueba.tipo] || 0) + resultado.totalCosto;

                for (const nivel in resultado.descuentosPorSisben) {
                    descuentosPorSisben += resultado.descuentosPorSisben[nivel];
                }
            }
            totalIngresosLaboratorio /= laboratorio.pruebas.length; // Calcular promedio de ingresos por laboratorio

            if (totalIngresosLaboratorio < ingresosTotales) {
                laboratoriosPorDebajo.push(laboratorio.nombre);
            } else if (totalIngresosLaboratorio > ingresosTotales) {
                laboratoriosPorEncima.push(laboratorio.nombre);
            }
        }

        return {
            ingresosTotales,
            ingresosPorRegimen,
            ingresosPorTipoExamen,
            descuentosPorSisben,
            promedioIngresosLaboratorio: ingresosTotales / this.laboratorios.length,
            laboratoriosPorDebajo,
            laboratoriosPorEncima
        };
    }
}

// Funcion principal
function main() {
    let farmaceutica = new Farmaceutica();
    let seguir = true;

    while (seguir) {
        let nombreLaboratorio = readline.question('Nombre del laboratorio: ');
        let laboratorio = new Laboratorio(nombreLaboratorio);
        farmaceutica.agregarLaboratorio(laboratorio);

        let agregarPrueba = true;
        while (agregarPrueba) {
            let nombrePrueba = readline.question('Nombre de la prueba: ');
            let tipoPrueba = readline.question('Tipo de prueba: ');
            let costoPrueba = parseFloat(readline.question('Costo de la prueba: '));
            let prueba = new Prueba(nombrePrueba, tipoPrueba, costoPrueba);
            laboratorio.agregarPrueba(prueba);

            let agregarPersona = true;
            while (agregarPersona) {
                let nombrePersona = readline.question('Nombre de la persona: ');
                let edadPersona = parseInt(readline.question('Edad de la persona: '));
                let generoPersona = readline.question('Genero de la persona (M/F): ').toUpperCase();
                let regimenPersona = readline.question('Regimen (subsidiado/contributivo): ').toLowerCase(); // Convertir a minúsculas
                let ingresoPersona = regimenPersona === 'contributivo' ? parseFloat(readline.question('Ingreso mensual de la persona: ')) : null;
                let nivelSisben = regimenPersona === 'subsidiado' ? readline.question('Nivel Sisben (A/B1/B2): ').toUpperCase() : null; // Convertir a mayúsculas

                let persona = new Persona(nombrePersona, edadPersona, generoPersona, regimenPersona, ingresoPersona, nivelSisben);
                prueba.agregarPersona(persona);

                agregarPersona = readline.question('Agregar otra persona a esta prueba? (s/n): ').toLowerCase() === 's';
            }

            agregarPrueba = readline.question('Agregar otra prueba al laboratorio? (s/n): ').toLowerCase() === 's';
        }

        seguir = readline.question('Registrar otro laboratorio? (s/n): ').toLowerCase() === 's';
    }

    let resultados = farmaceutica.calcularIngresosTotales();
    console.log('1. Ingresos totales por concepto de pruebas de laboratorio: $', resultados.ingresosTotales.toFixed(2));
    console.log('2. Ingresos totales por régimen:');
    console.log('Contributivo: $', resultados.ingresosPorRegimen.contributivo.toFixed(2));
    console.log('Subsidiado: $', resultados.ingresosPorRegimen.subsidiado.toFixed(2));
    console.log('3. Tipo de examen más rentable:', Object.keys(resultados.ingresosPorTipoExamen).reduce((a, b) => resultados.ingresosPorTipoExamen[a] > resultados.ingresosPorTipoExamen[b] ? a : b));
    console.log('4. Total de descuentos brindados según el Sisben: $', resultados.descuentosPorSisben.toFixed(2));
    console.log('5. Promedio de ingresos por laboratorio: $', resultados.promedioIngresosLaboratorio.toFixed(2));
    console.log('6. Laboratorios por debajo del promedio:', resultados.laboratoriosPorDebajo.length > 0 ? resultados.laboratoriosPorDebajo : 'Ninguno');
    console.log('7. Laboratorios por encima del promedio:', resultados.laboratoriosPorEncima.length > 0 ? resultados.laboratoriosPorEncima : 'Ninguno');
}

// Llamada a la función principal
main();