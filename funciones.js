// ===== CALCULADORA DE AGUA =====
(function () {
    'use strict';

    const abrirCalculadora = document.getElementById('abrirCalculadora');
    const cerrarCalculadora = document.getElementById('cerrarCalculadora');
    const modalCalculadora = document.getElementById('modalCalculadora');
    const formularioCalculadora = document.getElementById('formularioCalculadora');
    const pasosCalculadora = document.querySelectorAll('.paso-calculadora');
    const botonAnterior = document.getElementById('botonAnterior');
    const botonSiguiente = document.getElementById('botonSiguiente');
    const numeroPregunta = document.getElementById('numeroPregunta');
    const porcentajePregunta = document.getElementById('porcentajePregunta');
    const avanceProgreso = document.getElementById('avanceProgreso');
    const mensajeCalculadora = document.getElementById('mensajeCalculadora');
    const resultadoCalculadora = document.getElementById('resultadoCalculadora');
    const tituloResultado = document.getElementById('tituloResultado');
    const litrosResultado = document.getElementById('litrosResultado');
    const rellenoMedidor = document.getElementById('rellenoMedidor');
    const textoResultado = document.getElementById('textoResultado');
    const desgloseResultado = document.getElementById('desgloseResultado');
    const consejoAgua = document.getElementById('consejoAgua');
    const botonReiniciar = document.getElementById('botonReiniciar');

    if (!abrirCalculadora || !modalCalculadora || !formularioCalculadora || pasosCalculadora.length === 0) {
        return;
    }

    // ---------- VALORES QUE USA LA CALCULADORA ----------
    // Son estimaciones promedio. Las fuentes (CONAGUA, PROFECO, URSEA y otras)
    // dan rangos distintos, por eso se eligieron valores intermedios.
    // Si tu profesora prefiere otros, solo cambia los números de aquí.
    const valores = {
        // Litros que salen de la regadera por minuto (entre 9 y 15 en regaderas comunes)
        litrosPorMinutoRegadera: 12,

        // Si cierras la regadera al enjabonarte, se usa solo una parte del tiempo.
        // (Cerrarla ahorra entre 20 y 30 litros por baño)
        factorEnjabonar: { siempre: 0.7, aveces: 0.85, nunca: 1 },

        // Litros que se gastan en cada cepillado de dientes
        litrosPorCepillado: { siempre: 1, aveces: 3.5, nunca: 6 },

        // Litros que se gastan cada vez que te lavas las manos
        litrosPorLavadoManos: { siempre: 1.5, aveces: 3, nunca: 5 },

        // Litros por cada descarga del inodoro
        litrosPorDescarga: { botones: 4, palanca: 10, nosabe: 10 },

        // Litros que se gastan en cada lavada de platos
        litrosPorLavadaPlatos: { siempre: 12, aveces: 25, nunca: 40 },

        // Litros que gasta una lavadora en cada lavada
        litrosPorLavadaRopa: 70,

        // Minutos de regadera que se consideran un buen hábito
        minutosDuchaIdeal: 5,

        // Litros al día que se usan como referencia
        referenciaDiaria: 100
    };

    // Actividades que aparecen en el desglose del resultado
    const categorias = [
        { clave: 'ducha', nombre: 'Regadera', icono: 'fa-shower' },
        { clave: 'dientes', nombre: 'Cepillado de dientes', icono: 'fa-tooth' },
        { clave: 'manos', nombre: 'Lavado de manos', icono: 'fa-hands-bubbles' },
        { clave: 'bano', nombre: 'Inodoro', icono: 'fa-toilet' },
        { clave: 'platos', nombre: 'Lavar platos', icono: 'fa-utensils' },
        { clave: 'ropa', nombre: 'Lavar ropa', icono: 'fa-shirt' }
    ];

    let pasoActual = 0;

    // ---------- Contadores con botones + y - ----------
    function actualizarUnidad(paso) {
        const numero = paso.querySelector('.numero-contador');
        const unidad = paso.querySelector('.unidad-contador');

        unidad.textContent =
            Number(numero.textContent) === 1
                ? paso.dataset.singular
                : paso.dataset.plural;
    }

    function reiniciarContadores() {
        pasosCalculadora.forEach(function (paso) {
            if (paso.dataset.tipo !== 'numero') {
                return;
            }

            paso.querySelector('.numero-contador').textContent = paso.dataset.inicial;
            actualizarUnidad(paso);
        });
    }

    pasosCalculadora.forEach(function (paso) {
        if (paso.dataset.tipo !== 'numero') {
            return;
        }

        const minimo = Number(paso.dataset.minimo);
        const maximo = Number(paso.dataset.maximo);
        const numero = paso.querySelector('.numero-contador');

        paso.querySelectorAll('.boton-contador').forEach(function (boton) {
            boton.addEventListener('click', function () {
                const nuevo = Number(numero.textContent) + Number(boton.dataset.cambio);

                numero.textContent = Math.min(Math.max(nuevo, minimo), maximo);
                actualizarUnidad(paso);
            });
        });
    });

    // ---------- Abrir y cerrar ----------
    function mostrarCalculadora() {
        modalCalculadora.classList.add('activo');
        modalCalculadora.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function ocultarCalculadora() {
        modalCalculadora.classList.remove('activo');
        modalCalculadora.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // ---------- Mostrar la pregunta actual ----------
    function mostrarPaso() {
        const total = pasosCalculadora.length;
        const numero = pasoActual + 1;
        const porcentaje = Math.round((numero / total) * 100);

        pasosCalculadora.forEach(function (paso, indice) {
            paso.classList.toggle('paso-activo', indice === pasoActual);
        });

        numeroPregunta.textContent = `Pregunta ${numero} de ${total}`;
        porcentajePregunta.textContent = `${porcentaje}%`;
        avanceProgreso.style.width = `${porcentaje}%`;

        mensajeCalculadora.textContent = '';

        botonAnterior.classList.toggle('activo', pasoActual > 0);

        if (pasoActual === total - 1) {
            botonSiguiente.innerHTML = `
                Calcular resultado
                <i class="fa-solid fa-calculator"></i>
            `;
        } else {
            botonSiguiente.innerHTML = `
                Siguiente
                <i class="fa-solid fa-arrow-right"></i>
            `;
        }
    }

    // Las preguntas con contador siempre tienen respuesta; las de opciones, no
    function preguntaRespondida() {
        const paso = pasosCalculadora[pasoActual];

        if (paso.dataset.tipo === 'numero') {
            return true;
        }

        return paso.querySelector('input[type="radio"]:checked') !== null;
    }

    // ---------- Leer las respuestas ----------
    function leerRespuestas() {
        const respuestas = {};

        pasosCalculadora.forEach(function (paso) {
            const nombre = paso.dataset.nombre;

            if (paso.dataset.tipo === 'numero') {
                respuestas[nombre] = Number(
                    paso.querySelector('.numero-contador').textContent
                );
            } else {
                const elegida = paso.querySelector('input[type="radio"]:checked');

                respuestas[nombre] = elegida ? elegida.value : 'nunca';
            }
        });

        return respuestas;
    }

    // ---------- Calcular los litros al día ----------
    // Si "mejorado" es true, calcula cómo quedaría con los mejores hábitos
    function calcularGastos(respuestas, mejorado) {
        function habito(nombre) {
            return mejorado ? 'siempre' : respuestas[nombre];
        }

        const minutos = mejorado
            ? Math.min(respuestas.minutosDucha, valores.minutosDuchaIdeal)
            : respuestas.minutosDucha;

        // Se supone que la persona se baña todos los días
        const ducha = minutos *
            valores.litrosPorMinutoRegadera *
            valores.factorEnjabonar[habito('regaderaJabon')];

        const dientes = respuestas.vecesDientes *
            valores.litrosPorCepillado[habito('llaveDientes')];

        const manos = respuestas.vecesManos *
            valores.litrosPorLavadoManos[habito('llaveManos')];

        const bano = respuestas.vecesBano *
            valores.litrosPorDescarga[respuestas.tipoInodoro];

        // Las veces por semana se pasan a un promedio por día
        const platos = respuestas.vecesPlatos *
            valores.litrosPorLavadaPlatos[habito('llavePlatos')] / 7;

        // El agua de la ropa se reparte entre las personas de la casa
        const ropa = respuestas.lavadasRopa *
            valores.litrosPorLavadaRopa / respuestas.personasCasa / 7;

        return {
            ducha: ducha,
            dientes: dientes,
            manos: manos,
            bano: bano,
            platos: platos,
            ropa: ropa
        };
    }

    function sumarGastos(gastos) {
        return Object.keys(gastos).reduce(function (suma, clave) {
            return suma + gastos[clave];
        }, 0);
    }

    // ---------- Mostrar el resultado ----------
    function mostrarResultado() {
        const respuestas = leerRespuestas();
        const gastos = calcularGastos(respuestas, false);
        const gastosMejorados = calcularGastos(respuestas, true);

        const total = sumarGastos(gastos);
        const ahorro = Math.round(total - sumarGastos(gastosMejorados));

        // Título según los litros
        if (total <= valores.referenciaDiaria) {
            tituloResultado.textContent = '¡Excelente, cuidas muy bien el agua!';
        } else if (total <= valores.referenciaDiaria * 1.5) {
            tituloResultado.textContent = '¡Vas por buen camino!';
        } else {
            tituloResultado.textContent = '¡Puedes convertirte en un guardián del agua!';
        }

        litrosResultado.textContent = Math.round(total);

        // La barra llega al 100% con el doble de la referencia
        const proporcion = Math.min(total / (valores.referenciaDiaria * 2), 1);

        rellenoMedidor.style.width = '0%';

        setTimeout(function () {
            rellenoMedidor.style.width = (proporcion * 100) + '%';
        }, 50);

        // Desglose por actividad
        desgloseResultado.textContent = '';

        const mayorGasto = Math.max.apply(null, categorias.map(function (categoria) {
            return gastos[categoria.clave];
        }));

        let categoriaMayor = categorias[0];

        categorias.forEach(function (categoria) {
            const litros = gastos[categoria.clave];

            const fila = document.createElement('div');
            fila.className = 'fila-desglose';

            const datos = document.createElement('div');
            datos.className = 'datos-desglose';

            const icono = document.createElement('i');
            icono.classList.add('fa-solid', categoria.icono);

            const nombre = document.createElement('span');
            nombre.className = 'nombre-desglose';
            nombre.textContent = categoria.nombre;

            const cantidad = document.createElement('span');
            cantidad.className = 'litros-desglose';
            cantidad.textContent = Math.round(litros) + ' L';

            datos.appendChild(icono);
            datos.appendChild(nombre);
            datos.appendChild(cantidad);

            const barra = document.createElement('div');
            barra.className = 'barra-desglose';

            const relleno = document.createElement('span');
            relleno.style.width =
                mayorGasto > 0 ? (litros / mayorGasto) * 100 + '%' : '0%';

            barra.appendChild(relleno);

            fila.appendChild(datos);
            fila.appendChild(barra);
            desgloseResultado.appendChild(fila);

            if (litros === mayorGasto) {
                categoriaMayor = categoria;
            }
        });

        textoResultado.textContent =
            'Lo que más agua gasta en tu día: ' +
            categoriaMayor.nombre.toLowerCase() +
            ' (' + Math.round(mayorGasto) + ' litros).';

        // Consejo con el ahorro posible
        if (ahorro >= 5) {
            consejoAgua.textContent =
                'Si te bañas en 5 minutos y cierras la llave al enjabonarte, al cepillarte, ' +
                'al lavarte las manos y al lavar platos, podrías ahorrar unos ' + ahorro +
                ' litros al día (unos ' + (ahorro * 30) + ' litros al mes).';
        } else {
            consejoAgua.textContent =
                '¡Ya tienes muy buenos hábitos! Cuéntales a tu familia y a tus compañeros cómo lo haces.';
        }

        formularioCalculadora.style.display = 'none';
        resultadoCalculadora.classList.add('activo');
    }

    // ---------- Botones ----------
    abrirCalculadora.addEventListener('click', mostrarCalculadora);

    cerrarCalculadora.addEventListener('click', ocultarCalculadora);

    modalCalculadora.addEventListener('click', function (evento) {
        if (evento.target === modalCalculadora) {
            ocultarCalculadora();
        }
    });

    botonSiguiente.addEventListener('click', function () {
        if (!preguntaRespondida()) {
            mensajeCalculadora.textContent = 'Elige una respuesta para continuar.';
            return;
        }

        if (pasoActual === pasosCalculadora.length - 1) {
            mostrarResultado();
            return;
        }

        pasoActual++;
        mostrarPaso();
    });

    botonAnterior.addEventListener('click', function () {
        if (pasoActual > 0) {
            pasoActual--;
            mostrarPaso();
        }
    });

    botonReiniciar.addEventListener('click', function () {
        formularioCalculadora.reset();
        reiniciarContadores();

        pasoActual = 0;

        formularioCalculadora.style.display = 'block';
        resultadoCalculadora.classList.remove('activo');

        mostrarPaso();
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            ocultarCalculadora();
        }
    });

    reiniciarContadores();
    mostrarPaso();
})();

// ===== MASCOTA GOTI (SE PUEDE CREAR MÁS DE UNA) =====
function crearMascota(configuracion) {
    const boton = document.getElementById(configuracion.idBoton);
    const svg = document.getElementById(configuracion.idSvg);
    const globo = document.getElementById(configuracion.idGlobo);
    const texto = globo ? globo.querySelector('.mascota-texto') : null;

    if (!boton || !svg || !globo || !texto) {
        return null;
    }

    const salto = svg.querySelector('.goti-salto');
    const pupilas = svg.querySelector('.goti-pupilas');
    const frases = configuracion.frases || [];
    const menosMovimiento = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let indice = 0;
    let temporizadorAnimo = null;
    let intervaloFrases = null;

    function ponerAnimo(animo, duracion) {
        svg.classList.remove(
            'animo-feliz',
            'animo-contenta',
            'animo-triste',
            'animo-sorprendida'
        );
        svg.classList.add('animo-' + animo);

        clearTimeout(temporizadorAnimo);

        if (duracion) {
            temporizadorAnimo = setTimeout(function () {
                ponerAnimo('feliz');
            }, duracion);
        }
    }

    function decir(mensaje) {
        globo.classList.remove('cambia');
        void globo.offsetWidth;
        texto.textContent = mensaje;
        globo.classList.add('cambia');
    }

    function siguienteFrase() {
        indice = (indice + 1) % frases.length;
        decir(frases[indice]);
    }

    function saltar() {
        if (!salto) {
            return;
        }

        salto.classList.remove('salta');
        void salto.getBoundingClientRect();
        salto.classList.add('salta');
    }

    function reiniciarIntervalo() {
        clearInterval(intervaloFrases);

        intervaloFrases = setInterval(function () {
            if (!document.hidden) {
                siguienteFrase();
            }
        }, 10000);
    }

    boton.addEventListener('click', function () {
        saltar();
        ponerAnimo('sorprendida', 900);

        if (frases.length > 1) {
            siguienteFrase();
            reiniciarIntervalo();
        }
    });

    if (salto) {
        salto.addEventListener('animationend', function () {
            salto.classList.remove('salta');
        });
    }

    // Los ojos siguen al cursor
    if (pupilas && !menosMovimiento) {
        let ultimoX = 0;
        let ultimoY = 0;
        let pendiente = false;

        function moverOjos() {
            pendiente = false;

            const caja = svg.getBoundingClientRect();
            const centroX = caja.left + caja.width / 2;
            const centroY = caja.top + caja.height * 0.57;
            const dx = ultimoX - centroX;
            const dy = ultimoY - centroY;
            const distancia = Math.hypot(dx, dy) || 1;
            const fuerza = Math.min(distancia / 150, 1) * 5;

            pupilas.style.transform =
                'translate(' + (dx / distancia) * fuerza + 'px, ' +
                (dy / distancia) * fuerza + 'px)';
        }

        document.addEventListener('mousemove', function (evento) {
            ultimoX = evento.clientX;
            ultimoY = evento.clientY;

            if (!pendiente) {
                pendiente = true;
                requestAnimationFrame(moverOjos);
            }
        });
    }

    if (frases.length > 0) {
        decir(frases[0]);
    }

    if (frases.length > 1) {
        reiniciarIntervalo();
    }

    return {
        decir: decir,
        animo: ponerAnimo,
        saltar: saltar
    };
}

// Goti de la portada. Para usarlo desde otras partes:
// Goti.decir('¡Muy bien!'); Goti.animo('contenta', 3000); Goti.saltar();
window.Goti = crearMascota({
    idBoton: 'mascotaBoton',
    idSvg: 'gotiSvg',
    idGlobo: 'mascotaGlobo',
    frases: [
        '¡Hola! Soy Goti y te voy a ayudar a cuidar el agua.',
        'El ODS 6 busca que todas las personas tengan agua limpia y baños seguros.',
        'Si cierras la llave mientras te cepillas los dientes, no desperdicias agua.',
        'Una llave que gotea parece poca cosa, pero el agua se va sumando cada día.',
        'El agua dulce es limitada, por eso hay que cuidarla entre todos.',
        'Lavarte las manos con agua y jabón ayuda a evitar enfermedades.',
        '¿Quieres saber cuánta agua usas? Prueba la calculadora.'
    ]
});

// ===== SELECTOR DE NIVEL (PRIMARIA / SECUNDARIA) =====
(function () {
    'use strict';

    const contenedor = document.querySelector('.contenido-nivel');
    const botones = document.querySelectorAll('.boton-nivel');

    if (!contenedor || botones.length === 0) {
        return;
    }

    function aplicarNivel(nivel) {
        contenedor.dataset.nivel = nivel;

        botones.forEach(function (boton) {
            const activo = boton.dataset.nivel === nivel;

            boton.classList.toggle('activo', activo);
            boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
        });
    }

    botones.forEach(function (boton) {
        boton.addEventListener('click', function () {
            aplicarNivel(boton.dataset.nivel);
        });
    });

    // Para cambiar el nivel desde otras partes: NivelEducativo.aplicar('secundaria')
    window.NivelEducativo = {
        aplicar: aplicarNivel
    };
})();

// ===== ACCESO: INICIO DE SESIÓN Y REGISTRO =====
(function () {
    'use strict';

    const pantallaAcceso = document.getElementById('pantallaAcceso');
    const sitio = document.getElementById('sitio');

    if (!pantallaAcceso || !sitio) {
        return;
    }

    const pasoInicio = document.getElementById('pasoInicio');
    const formularioIngreso = document.getElementById('formularioIngreso');
    const formularioRegistro = document.getElementById('formularioRegistro');
    const botonIrIngreso = document.getElementById('botonIrIngreso');
    const botonIrRegistro = document.getElementById('botonIrRegistro');
    const botonInvitado = document.getElementById('botonInvitado');
    const botonesVolver = document.querySelectorAll('[data-volver]');
    const casillasMostrar = document.querySelectorAll('[data-mostrar-contrasena]');
    const nombreUsuarioSesion = document.getElementById('nombreUsuarioSesion');
    const botonSalir = document.getElementById('botonSalir');

    const gotiAcceso = crearMascota({
        idBoton: 'mascotaBotonAcceso',
        idSvg: 'gotiSvgAcceso',
        idGlobo: 'globoAcceso',
        frases: []
    });

    const claveUsuarios = 'aglisaUsuarios';
    const claveSesion = 'aglisaSesion';

    const mensajeInicio = '¡Hola! Soy Goti. ¿Ya tienes cuenta o eres nuevo?';

    const pasos = {
        inicio: pasoInicio,
        ingreso: formularioIngreso,
        registro: formularioRegistro
    };

    let ocupado = false;

    // ---------- Goti habla ----------
    function gotiDice(mensaje, animo) {
        if (!gotiAcceso) {
            return;
        }

        gotiAcceso.decir(mensaje);

        if (animo) {
            gotiAcceso.animo(animo, 2500);
        }
    }

    // ---------- Guardado en el navegador ----------
    function leerUsuarios() {
        try {
            return JSON.parse(localStorage.getItem(claveUsuarios) || '[]');
        } catch (error) {
            return [];
        }
    }

    function guardarUsuarios(lista) {
        try {
            localStorage.setItem(claveUsuarios, JSON.stringify(lista));
            return true;
        } catch (error) {
            return false;
        }
    }

    function leerSesion() {
        try {
            return JSON.parse(sessionStorage.getItem(claveSesion) || 'null');
        } catch (error) {
            return null;
        }
    }

    function guardarSesion(sesion) {
        try {
            sessionStorage.setItem(claveSesion, JSON.stringify(sesion));
        } catch (error) {
            // Si no se puede guardar, la sesión dura mientras la página siga abierta
        }
    }

    function borrarSesion() {
        try {
            sessionStorage.removeItem(claveSesion);
        } catch (error) {
            // No pasa nada si no había nada que borrar
        }
    }

    // ---------- Contraseñas cifradas ----------
    function cifradoDisponible() {
        return Boolean(window.crypto && window.crypto.subtle);
    }

    function convertirAHexadecimal(datos) {
        return Array.from(new Uint8Array(datos)).map(function (numero) {
            return numero.toString(16).padStart(2, '0');
        }).join('');
    }

    function crearSal() {
        const aleatorio = new Uint8Array(16);

        crypto.getRandomValues(aleatorio);

        return convertirAHexadecimal(aleatorio);
    }

    async function calcularHuella(contrasena, sal) {
        const codificador = new TextEncoder();

        const material = await crypto.subtle.importKey(
            'raw',
            codificador.encode(contrasena),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const bits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: codificador.encode(sal),
                iterations: 100000,
                hash: 'SHA-256'
            },
            material,
            256
        );

        return convertirAHexadecimal(bits);
    }

    // ---------- Pasos de la pantalla ----------
    function mostrarPaso(nombre) {
        Object.keys(pasos).forEach(function (clave) {
            pasos[clave].hidden = clave !== nombre;
        });
    }

    function limpiarFormularios() {
        formularioIngreso.reset();
        formularioRegistro.reset();

        document.getElementById('ingresoContrasena').type = 'password';
        document.getElementById('registroContrasena').type = 'password';
    }

    // ---------- Entrar y salir del sitio ----------
    function abrirSitio(sesion) {
        sitio.hidden = false;
        document.body.classList.remove('acceso-abierto');

        nombreUsuarioSesion.textContent =
            sesion.invitado ? 'Invitado' : sesion.usuario;

        if (sesion.nivel && window.NivelEducativo) {
            NivelEducativo.aplicar(sesion.nivel);
        }

        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('resize'));
    }

    function entrar(sesion, mensaje) {
        ocupado = true;

        guardarSesion(sesion);

        gotiDice(mensaje, 'contenta');

        if (gotiAcceso) {
            gotiAcceso.saltar();
        }

        setTimeout(function () {
            abrirSitio(sesion);
            pantallaAcceso.classList.add('saliendo');

            setTimeout(function () {
                pantallaAcceso.hidden = true;
                pantallaAcceso.classList.remove('saliendo');
                limpiarFormularios();
                mostrarPaso('inicio');
                ocupado = false;
            }, 500);
        }, 1500);
    }

    function salir() {
        borrarSesion();

        sitio.hidden = true;
        pantallaAcceso.hidden = false;
        document.body.classList.add('acceso-abierto');

        limpiarFormularios();
        mostrarPaso('inicio');

        gotiDice('¡Hasta pronto! Aquí estaré cuando quieras volver.', 'feliz');

        window.scrollTo(0, 0);
    }

    // ---------- Botones de la pantalla ----------
    botonIrIngreso.addEventListener('click', function () {
        mostrarPaso('ingreso');
        gotiDice('¡Qué bueno verte! Escribe tu usuario y tu contraseña.', 'contenta');
        document.getElementById('ingresoUsuario').focus();
    });

    botonIrRegistro.addEventListener('click', function () {
        mostrarPaso('registro');
        gotiDice('¡Vamos a crear tu cuenta! Inventa un nombre de usuario, no uses tu nombre real.', 'contenta');
        document.getElementById('registroUsuario').focus();
    });

    botonInvitado.addEventListener('click', function () {
        if (ocupado) {
            return;
        }

        entrar({ invitado: true }, '¡Pasa! Puedes crear tu cuenta cuando quieras.');
    });

    botonesVolver.forEach(function (boton) {
        boton.addEventListener('click', function () {
            mostrarPaso('inicio');
            gotiDice(mensajeInicio, 'feliz');
        });
    });

    casillasMostrar.forEach(function (casilla) {
        casilla.addEventListener('change', function () {
            const campo = document.getElementById(casilla.dataset.mostrarContrasena);

            if (campo) {
                campo.type = casilla.checked ? 'text' : 'password';
            }
        });
    });

    botonSalir.addEventListener('click', salir);

    // ---------- Inicio de sesión ----------
    formularioIngreso.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        if (ocupado) {
            return;
        }

        if (!cifradoDisponible()) {
            gotiDice('Este navegador no permite usar cuentas aquí. Prueba con otro.', 'triste');
            return;
        }

        const usuario = document.getElementById('ingresoUsuario').value.trim();
        const contrasena = document.getElementById('ingresoContrasena').value;

        if (usuario === '' || contrasena === '') {
            gotiDice('Escribe tu usuario y tu contraseña.', 'triste');
            return;
        }

        const cuenta = leerUsuarios().find(function (elemento) {
            return elemento.clave === usuario.toLowerCase();
        });

        if (!cuenta) {
            gotiDice('No encuentro ese usuario. ¿Lo escribiste bien o quieres crear una cuenta?', 'triste');
            return;
        }

        ocupado = true;

        const huella = await calcularHuella(contrasena, cuenta.sal);

        ocupado = false;

        if (huella !== cuenta.huella) {
            gotiDice('Esa contraseña no es la correcta. ¡Intenta otra vez!', 'triste');
            return;
        }

        entrar(
            { usuario: cuenta.usuario, escuela: cuenta.escuela, nivel: cuenta.nivel },
            '¡Bienvenido de nuevo, ' + cuenta.usuario + '!'
        );
    });

    // ---------- Registro ----------
    formularioRegistro.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        if (ocupado) {
            return;
        }

        if (!cifradoDisponible()) {
            gotiDice('Este navegador no permite crear cuentas aquí. Prueba con otro.', 'triste');
            return;
        }

        const usuario = document.getElementById('registroUsuario').value.trim();
        const contrasena = document.getElementById('registroContrasena').value;
        const escuela = document.getElementById('registroEscuela').value.trim();
        const nivelElegido = formularioRegistro.querySelector(
            'input[name="nivelRegistro"]:checked'
        );

        if (!/^[A-Za-z0-9_.]{3,20}$/.test(usuario)) {
            gotiDice('Tu usuario debe tener de 3 a 20 letras o números, sin espacios.', 'triste');
            return;
        }

        if (contrasena.length < 6) {
            gotiDice('Tu contraseña necesita al menos 6 caracteres.', 'triste');
            return;
        }

        if (escuela === '') {
            gotiDice('Escribe el nombre de tu escuela.', 'triste');
            return;
        }

        if (!nivelElegido) {
            gotiDice('Falta elegir tu nivel: primaria o secundaria.', 'triste');
            return;
        }

        const usuarios = leerUsuarios();
        const clave = usuario.toLowerCase();

        const yaExiste = usuarios.some(function (elemento) {
            return elemento.clave === clave;
        });

        if (yaExiste) {
            gotiDice('Ese usuario ya existe. ¡Elige otro nombre!', 'triste');
            return;
        }

        ocupado = true;

        const sal = crearSal();
        const huella = await calcularHuella(contrasena, sal);

        ocupado = false;

        const cuenta = {
            clave: clave,
            usuario: usuario,
            escuela: escuela,
            nivel: nivelElegido.value,
            sal: sal,
            huella: huella
        };

        usuarios.push(cuenta);

        if (!guardarUsuarios(usuarios)) {
            gotiDice('No pude guardar tu cuenta en este navegador. Avísale a tu maestro.', 'triste');
            return;
        }

        entrar(
            { usuario: cuenta.usuario, escuela: cuenta.escuela, nivel: cuenta.nivel },
            '¡Listo, ' + cuenta.usuario + '! Tu cuenta está creada.'
        );
    });

    // ---------- Al abrir la página ----------
    const sesionActual = leerSesion();

    if (sesionActual) {
        pantallaAcceso.hidden = true;
        abrirSitio(sesionActual);
    } else {
        mostrarPaso('inicio');
        gotiDice(mensajeInicio);
    }
})();

// ===== MAPA INTERACTIVO DE MÉXICO =====
(function () {
    'use strict';

    const cuadricula = document.getElementById('cuadriculaMapa');
    const nombreEstado = document.getElementById('nombreEstado');
    const cifraEstado = document.getElementById('cifraEstado');
    const notaEstado = document.getElementById('notaEstado');
    const fuenteEstado = document.getElementById('fuenteEstado');

    if (!cuadricula || !nombreEstado || !cifraEstado || !notaEstado || !fuenteEstado) {
        return;
    }

    // Para completar un estado, agrega "porcentaje", "nota" y "fuente".
    // Ejemplo: porcentaje: 95, nota: 'Texto...', fuente: 'INEGI, Censo 2020'
    const estados = [
        {
            nombre: 'Baja California', abreviatura: 'BC', columna: 0, fila: 0,
            porcentaje: 98,
            nota: 'Cerca de 98 de cada 100 personas tienen servicio de agua entubada.',
            fuente: 'INEGI, Censo 2020 (según Amapola Periodismo)'
        },
        { nombre: 'Sonora', abreviatura: 'Son', columna: 1, fila: 0 },
        { nombre: 'Chihuahua', abreviatura: 'Chih', columna: 2, fila: 0 },
        { nombre: 'Coahuila', abreviatura: 'Coah', columna: 3, fila: 0 },
        {
            nombre: 'Nuevo León', abreviatura: 'NL', columna: 4, fila: 0,
            porcentaje: 98.6,
            nota: 'El 98.6% de las personas vive en casas con agua entubada, y el 96.8% la tiene dentro de la vivienda.',
            fuente: 'INEGI, Censo 2020 (Datos abiertos de Nuevo León)'
        },
        {
            nombre: 'Tamaulipas', abreviatura: 'Tam', columna: 5, fila: 0,
            porcentaje: 98,
            nota: 'Cerca de 98 de cada 100 personas tienen servicio de agua entubada.',
            fuente: 'INEGI, Censo 2020 (según Amapola Periodismo)'
        },
        {
            nombre: 'Baja California Sur', abreviatura: 'BCS', columna: 0, fila: 1,
            porcentaje: 98,
            nota: 'Cerca de 98 de cada 100 personas tienen servicio de agua entubada. Pero un análisis de BBVA Research (2022) encontró que menos del 32% de los hogares recibió agua entubada todos los días: tener tubería no siempre significa tener agua cada día.',
            fuente: 'INEGI, Censo 2020 (según Amapola Periodismo); BBVA Research'
        },
        { nombre: 'Sinaloa', abreviatura: 'Sin', columna: 1, fila: 1 },
        { nombre: 'Durango', abreviatura: 'Dgo', columna: 2, fila: 1 },
        { nombre: 'Zacatecas', abreviatura: 'Zac', columna: 3, fila: 1 },
        { nombre: 'San Luis Potosí', abreviatura: 'SLP', columna: 4, fila: 1 },
        { nombre: 'Nayarit', abreviatura: 'Nay', columna: 1, fila: 2 },
        { nombre: 'Jalisco', abreviatura: 'Jal', columna: 2, fila: 2 },
        { nombre: 'Aguascalientes', abreviatura: 'Ags', columna: 3, fila: 2 },
        { nombre: 'Guanajuato', abreviatura: 'Gto', columna: 4, fila: 2 },
        { nombre: 'Querétaro', abreviatura: 'Qro', columna: 5, fila: 2 },
        { nombre: 'Hidalgo', abreviatura: 'Hgo', columna: 6, fila: 2 },
        {
            nombre: 'Veracruz', abreviatura: 'Ver', columna: 7, fila: 2,
            nota: 'Es el estado con más viviendas sin agua entubada: unas 202,241.',
            fuente: 'INEGI, Censo 2020 (según El CEO)'
        },
        { nombre: 'Yucatán', abreviatura: 'Yuc', columna: 9, fila: 2 },
        { nombre: 'Colima', abreviatura: 'Col', columna: 2, fila: 3 },
        { nombre: 'Michoacán', abreviatura: 'Mich', columna: 3, fila: 3 },
        {
            nombre: 'Estado de México', abreviatura: 'Mex', columna: 4, fila: 3,
            nota: 'Unas 118,409 viviendas no tienen agua entubada.',
            fuente: 'INEGI, Censo 2020 (según El CEO)'
        },
        { nombre: 'Ciudad de México', abreviatura: 'CDMX', columna: 5, fila: 3 },
        { nombre: 'Tlaxcala', abreviatura: 'Tlax', columna: 6, fila: 3 },
        { nombre: 'Puebla', abreviatura: 'Pue', columna: 7, fila: 3 },
        { nombre: 'Tabasco', abreviatura: 'Tab', columna: 8, fila: 3 },
        { nombre: 'Quintana Roo', abreviatura: 'QRoo', columna: 9, fila: 3 },
        {
            nombre: 'Guerrero', abreviatura: 'Gro', columna: 4, fila: 4,
            porcentaje: 72,
            nota: 'Es uno de los estados con menos viviendas con agua entubada: alrededor de 72 de cada 100. Además, unas 103,991 viviendas no tienen este servicio.',
            fuente: 'INEGI, Censo 2020 (según Amapola Periodismo y El CEO)'
        },
        { nombre: 'Morelos', abreviatura: 'Mor', columna: 5, fila: 4 },
        {
            nombre: 'Oaxaca', abreviatura: 'Oax', columna: 7, fila: 4,
            porcentaje: 70,
            nota: 'Es el estado con menos viviendas con agua entubada: alrededor de 70 de cada 100. Unas 110,050 viviendas no tienen este servicio.',
            fuente: 'INEGI, Censo 2020 (según Amapola Periodismo y El CEO)'
        },
        {
            nombre: 'Chiapas', abreviatura: 'Chis', columna: 8, fila: 4,
            nota: 'Unas 133,616 viviendas no tienen agua entubada, una de las cifras más altas del país.',
            fuente: 'INEGI, Censo 2020 (según El CEO)'
        },
        { nombre: 'Campeche', abreviatura: 'Camp', columna: 9, fila: 4 }
    ];

    // Decide el color del cuadro según los datos que tenga el estado
    function tipoDeEstado(estado) {
        if (estado.porcentaje === undefined) {
            return estado.nota ? 'rezago' : 'sin-dato';
        }

        return estado.porcentaje >= 95 ? 'alto' : 'bajo';
    }

    // Muestra los datos del estado en el panel
    function mostrarEstado(estado) {
        nombreEstado.textContent = estado.nombre;

        cifraEstado.textContent =
            estado.porcentaje !== undefined ? estado.porcentaje + '%' : '';

        notaEstado.textContent =
            estado.nota || 'Todavía no tenemos el dato de este estado.';

        fuenteEstado.textContent =
            estado.fuente ? 'Fuente: ' + estado.fuente : '';
    }

    const botonesEstados = [];

    estados.forEach(function (estado) {
        const boton = document.createElement('button');

        boton.type = 'button';
        boton.className = 'estado estado-' + tipoDeEstado(estado);
        boton.textContent = estado.abreviatura;
        boton.title = estado.nombre;
        boton.setAttribute('aria-label', estado.nombre);
        boton.setAttribute('aria-pressed', 'false');
        boton.style.gridColumn = estado.columna + 1;
        boton.style.gridRow = estado.fila + 1;

        boton.addEventListener('click', function () {
            botonesEstados.forEach(function (otro) {
                otro.setAttribute('aria-pressed', 'false');
            });

            boton.setAttribute('aria-pressed', 'true');
            mostrarEstado(estado);
        });

        botonesEstados.push(boton);
        cuadricula.appendChild(boton);
    });
})();

// ===== EL VIAJE DE UNA GOTA (DIBUJO) =====
(function () {
    'use strict';

    const camino = document.getElementById('caminoGota');
    const gota = document.getElementById('gotaViaje');
    const estaciones = document.querySelectorAll('.estacion-viaje');
    const detalles = document.querySelectorAll('.detalle-etapa');
    const puntos = document.querySelectorAll('.punto-viaje');
    const botonViajeAnterior = document.getElementById('botonViajeAnterior');
    const botonViajeSiguiente = document.getElementById('botonViajeSiguiente');

    if (!camino || !gota || estaciones.length === 0) {
        return;
    }

    const ultimaEtapa = estaciones.length - 1;
    const menosMovimiento = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let etapaActual = 0;
    let longitudActual = 0;
    let longitudes = null;
    let animacion = null;

    // Calcula en qué punto del camino queda cada etapa.
    // Se hace la primera vez que se necesita, cuando el sitio ya está a la vista.
    function calcularLongitudes() {
        try {
            const total = camino.getTotalLength();

            if (!total) {
                return false;
            }

            longitudes = Array.from(estaciones).map(function (estacion) {
                const x = Number(estacion.dataset.x);
                const y = Number(estacion.dataset.y);

                let mejorLongitud = 0;
                let mejorDistancia = Infinity;

                for (let longitud = 0; longitud <= total; longitud += 2) {
                    const punto = camino.getPointAtLength(longitud);
                    const distancia = Math.hypot(punto.x - x, punto.y - y);

                    if (distancia < mejorDistancia) {
                        mejorDistancia = distancia;
                        mejorLongitud = longitud;
                    }
                }

                return mejorLongitud;
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    function longitudesListas() {
        return longitudes !== null || calcularLongitudes();
    }

    // Pone la gota en un punto del camino
    function ponerEnLongitud(longitud) {
        longitudActual = longitud;

        const punto = camino.getPointAtLength(longitud);

        gota.setAttribute('transform', 'translate(' + punto.x + ' ' + punto.y + ')');
    }

    // Mueve la gota despacio por el camino hasta la etapa elegida
    function moverGotaHasta(indice) {
        cancelAnimationFrame(animacion);

        if (!longitudesListas()) {
            const estacion = estaciones[indice];

            gota.setAttribute(
                'transform',
                'translate(' + estacion.dataset.x + ' ' + estacion.dataset.y + ')'
            );
            return;
        }

        const inicio = longitudActual;
        const destino = longitudes[indice];
        const recorrido = destino - inicio;

        const duracion = menosMovimiento
            ? 0
            : Math.min(2600, Math.max(600, Math.abs(recorrido) * 4));

        if (duracion === 0) {
            ponerEnLongitud(destino);
            return;
        }

        const horaInicio = performance.now();

        function darPaso(ahora) {
            const avance = Math.min((ahora - horaInicio) / duracion, 1);
            const suave = avance < 0.5
                ? 2 * avance * avance
                : 1 - Math.pow(-2 * avance + 2, 2) / 2;

            ponerEnLongitud(inicio + recorrido * suave);

            if (avance < 1) {
                animacion = requestAnimationFrame(darPaso);
            }
        }

        animacion = requestAnimationFrame(darPaso);
    }

    // Cambia la etapa que se ve (texto, números y botones)
    function mostrarEtapa(indice) {
        etapaActual = indice;

        estaciones.forEach(function (estacion, posicion) {
            estacion.classList.toggle('activa', posicion === indice);
        });

        detalles.forEach(function (detalle, posicion) {
            detalle.hidden = posicion !== indice;
        });

        puntos.forEach(function (punto, posicion) {
            punto.classList.toggle('activo', posicion === indice);
            punto.setAttribute('aria-current', posicion === indice ? 'step' : 'false');
        });

        botonViajeAnterior.disabled = indice === 0;

        if (indice === ultimaEtapa) {
            botonViajeSiguiente.innerHTML = `
                Empezar de nuevo
                <i class="fa-solid fa-rotate-right"></i>
            `;
        } else {
            botonViajeSiguiente.innerHTML = `
                Siguiente
                <i class="fa-solid fa-arrow-right"></i>
            `;
        }
    }

    function irAEtapa(indice) {
        mostrarEtapa(indice);
        moverGotaHasta(indice);
    }

    botonViajeAnterior.addEventListener('click', function () {
        if (etapaActual > 0) {
            irAEtapa(etapaActual - 1);
        }
    });

    botonViajeSiguiente.addEventListener('click', function () {
        if (etapaActual === ultimaEtapa) {
            irAEtapa(0);
        } else {
            irAEtapa(etapaActual + 1);
        }
    });

    puntos.forEach(function (punto) {
        punto.addEventListener('click', function () {
            irAEtapa(Number(punto.dataset.indice));
        });
    });

    estaciones.forEach(function (estacion) {
        estacion.addEventListener('click', function () {
            irAEtapa(Number(estacion.dataset.indice));
        });
    });

    // Al empezar, la gota está en el río
    mostrarEtapa(0);
})();

// ===== METAS DEL ODS 6 (TARJETAS QUE SE VOLTEAN) =====
(function () {
    'use strict';

    const metas = document.querySelectorAll('.meta');

    metas.forEach(function (meta) {
        meta.addEventListener('click', function () {
            const volteada = meta.getAttribute('aria-pressed') === 'true';

            meta.setAttribute('aria-pressed', volteada ? 'false' : 'true');
        });
    });
})();

// ===== ¿QUÉ PUEDO HACER YO? (COMPROMISOS) =====
(function () {
    'use strict';

    const casillas = document.querySelectorAll('.compromiso input');
    const textoCompromisos = document.getElementById('textoCompromisos');
    const avanceCompromisos = document.getElementById('avanceCompromisos');
    const mensajeCompromisos = document.getElementById('mensajeCompromisos');

    if (casillas.length === 0 || !textoCompromisos || !avanceCompromisos || !mensajeCompromisos) {
        return;
    }

    const claveAlmacenamiento = 'aglisaCompromisos';

    // Guarda en el navegador cuáles compromisos están marcados
    function guardarCompromisos() {
        const marcados = [];

        casillas.forEach(function (casilla, indice) {
            if (casilla.checked) {
                marcados.push(indice);
            }
        });

        try {
            localStorage.setItem(claveAlmacenamiento, JSON.stringify(marcados));
        } catch (error) {
            // Si el navegador no deja guardar, el sitio sigue funcionando igual
        }
    }

    // Recupera los compromisos guardados la última vez
    function cargarCompromisos() {
        try {
            const guardados = JSON.parse(
                localStorage.getItem(claveAlmacenamiento) || '[]'
            );

            guardados.forEach(function (indice) {
                if (casillas[indice]) {
                    casillas[indice].checked = true;
                }
            });
        } catch (error) {
            // Si no hay datos guardados, se empieza desde cero
        }
    }

    function actualizarCompromisos(celebrar) {
        let total = 0;

        casillas.forEach(function (casilla) {
            if (casilla.checked) {
                total++;
            }
        });

        textoCompromisos.textContent =
            total + ' de ' + casillas.length + ' compromisos';

        avanceCompromisos.style.width =
            (total / casillas.length) * 100 + '%';

        if (total === 0) {
            mensajeCompromisos.textContent = 'Elige tu primera acción.';
        } else if (total === casillas.length) {
            mensajeCompromisos.textContent =
                '¡Eres un guardián del agua! Completaste todos tus compromisos.';

            if (celebrar && window.Goti) {
                Goti.animo('contenta', 4000);
                Goti.saltar();
                Goti.decir('¡Completaste todos tus compromisos! Gracias por cuidar el agua.');
            }
        } else {
            mensajeCompromisos.textContent = '¡Muy bien! Sigue sumando acciones.';
        }
    }

    casillas.forEach(function (casilla) {
        casilla.addEventListener('change', function () {
            guardarCompromisos();
            actualizarCompromisos(true);
        });
    });

    cargarCompromisos();
    actualizarCompromisos(false);
})();

// ===== MITOS Y VERDADES (QUIZ) =====
(function () {
    'use strict';

    const progresoQuiz = document.getElementById('progresoQuiz');
    const afirmacionQuiz = document.getElementById('afirmacionQuiz');
    const botonVerdad = document.getElementById('botonVerdad');
    const botonMito = document.getElementById('botonMito');
    const retroalimentacion = document.getElementById('retroalimentacionQuiz');
    const resultadoRespuesta = document.getElementById('resultadoRespuesta');
    const explicacionQuiz = document.getElementById('explicacionQuiz');
    const botonSiguienteQuiz = document.getElementById('botonSiguienteQuiz');
    const vistaPregunta = document.getElementById('vistaPregunta');
    const vistaFinal = document.getElementById('vistaFinal');
    const tituloFinalQuiz = document.getElementById('tituloFinalQuiz');
    const textoFinalQuiz = document.getElementById('textoFinalQuiz');
    const botonReiniciarQuiz = document.getElementById('botonReiniciarQuiz');

    if (!progresoQuiz || !afirmacionQuiz || !botonVerdad || !botonMito || !vistaPregunta || !vistaFinal) {
        return;
    }

    const preguntas = [
        {
            afirmacion: 'En el planeta hay agua dulce infinita para usar.',
            esVerdad: false,
            explicacion: {
                primaria: 'El agua dulce que podemos usar es poca. Por eso hay que cuidarla entre todos.',
                secundaria: 'Solo una pequeña parte del agua del planeta es agua dulce utilizable, por eso su gestión sostenible es tan importante.'
            }
        },
        {
            afirmacion: 'Una llave que gotea no desperdicia mucha agua.',
            esVerdad: false,
            explicacion: {
                primaria: 'Cada gota parece poca cosa, pero si gotea todo el día se pierde mucha agua.',
                secundaria: 'Una fuga pequeña, sumada durante días y semanas, puede desperdiciar una cantidad importante de agua.'
            }
        },
        {
            afirmacion: 'Cerrar la llave mientras te cepillas los dientes ayuda a ahorrar agua.',
            esVerdad: true,
            explicacion: {
                primaria: '¡Sí! Si la llave está cerrada, el agua no corre mientras te cepillas.',
                secundaria: 'Correcto: mantener la llave abierta sin necesidad hace que el agua corra sin que se use.'
            }
        },
        {
            afirmacion: 'Todas las personas tienen agua potable y baños limpios en su casa o en su escuela.',
            esVerdad: false,
            explicacion: {
                primaria: 'Todavía hay personas y escuelas sin agua limpia o sin baños seguros. Por eso existe el ODS 6.',
                secundaria: 'Aún hay personas y escuelas sin acceso a agua potable ni a saneamiento adecuado; el ODS 6 busca cambiar eso.'
            }
        },
        {
            afirmacion: 'Es buena idea tirar el aceite de cocina por el drenaje.',
            esVerdad: false,
            explicacion: {
                primaria: 'El aceite ensucia el agua y tapa las tuberías. Se guarda en un envase cerrado y se tira a la basura.',
                secundaria: 'El aceite contamina el agua y puede obstruir el alcantarillado; conviene guardarlo en un recipiente cerrado y desecharlo como residuo.'
            }
        },
        {
            afirmacion: 'Lavarte las manos con agua y jabón ayuda a evitar enfermedades.',
            esVerdad: true,
            explicacion: {
                primaria: '¡Sí! Lavarte las manos quita gérmenes y nos ayuda a no enfermar.',
                secundaria: 'Correcto: la higiene de manos reduce la propagación de microorganismos que causan enfermedades.'
            }
        },
        {
            afirmacion: 'Si una casa tiene tuberías, siempre sale agua todos los días.',
            esVerdad: false,
            explicacion: {
                primaria: 'No siempre. En algunos lugares hay tubos, pero el agua no llega todos los días.',
                secundaria: 'No necesariamente: tener tubería no garantiza un suministro diario; la continuidad del servicio también importa.'
            }
        }
    ];

    let indicePregunta = 0;
    let aciertos = 0;

    // Escribe un texto en sus dos versiones; el selector de nivel muestra la que toca
    function escribirPorNivel(elemento, textos) {
        elemento.textContent = '';

        ['primaria', 'secundaria'].forEach(function (nivel) {
            const parte = document.createElement('span');

            parte.className = 'texto-' + nivel;
            parte.textContent = textos[nivel];
            elemento.appendChild(parte);
        });
    }

    function mostrarPregunta() {
        const pregunta = preguntas[indicePregunta];

        progresoQuiz.textContent =
            'Pregunta ' + (indicePregunta + 1) + ' de ' + preguntas.length;

        afirmacionQuiz.textContent = pregunta.afirmacion;

        botonVerdad.disabled = false;
        botonMito.disabled = false;
        botonVerdad.classList.remove('correcta', 'incorrecta');
        botonMito.classList.remove('correcta', 'incorrecta');

        retroalimentacion.hidden = true;
    }

    function responder(eligioVerdad) {
        const pregunta = preguntas[indicePregunta];
        const acerto = eligioVerdad === pregunta.esVerdad;
        const botonElegido = eligioVerdad ? botonVerdad : botonMito;

        if (acerto) {
            aciertos++;
        }

        botonVerdad.disabled = true;
        botonMito.disabled = true;
        botonElegido.classList.add(acerto ? 'correcta' : 'incorrecta');

        resultadoRespuesta.textContent = acerto
            ? '¡Correcto!'
            : 'Casi. ' + (pregunta.esVerdad ? 'Es verdad.' : 'Es un mito.');

        resultadoRespuesta.className =
            'resultado-respuesta ' + (acerto ? 'acierto' : 'error');

        escribirPorNivel(explicacionQuiz, pregunta.explicacion);

        botonSiguienteQuiz.textContent =
            indicePregunta === preguntas.length - 1 ? 'Ver resultado' : 'Siguiente';

        retroalimentacion.hidden = false;
    }

    function mostrarResultadoFinal() {
        vistaPregunta.hidden = true;
        vistaFinal.hidden = false;

        if (aciertos === preguntas.length) {
            tituloFinalQuiz.textContent = '¡Eres un guardián del agua!';
        } else if (aciertos >= 5) {
            tituloFinalQuiz.textContent = '¡Muy bien!';
        } else {
            tituloFinalQuiz.textContent = '¡Sigue aprendiendo!';
        }

        textoFinalQuiz.textContent =
            'Acertaste ' + aciertos + ' de ' + preguntas.length + '.';
    }

    botonVerdad.addEventListener('click', function () {
        responder(true);
    });

    botonMito.addEventListener('click', function () {
        responder(false);
    });

    botonSiguienteQuiz.addEventListener('click', function () {
        if (indicePregunta === preguntas.length - 1) {
            mostrarResultadoFinal();
            return;
        }

        indicePregunta++;
        mostrarPregunta();
    });

    botonReiniciarQuiz.addEventListener('click', function () {
        indicePregunta = 0;
        aciertos = 0;

        vistaFinal.hidden = true;
        vistaPregunta.hidden = false;

        mostrarPregunta();
    });

    mostrarPregunta();
})();