// Script para cargar datos de prueba en Supabase
// Org: quinchodebere@gmail.com — org_id: fa754111-fd17-426e-a671-f575fcded035
// Para borrar todo después: node seed_test_data.js --borrar

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wazxnwskfozazsjofugo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const ORG_ID = 'fa754111-fd17-426e-a671-f575fcded035';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BORRAR = process.argv.includes('--borrar');

// ─── IDs fijos para poder borrar luego ───────────────────────
const ESC = {
  e1: 'seed-esc-001', e2: 'seed-esc-002', e3: 'seed-esc-003', e4: 'seed-esc-004'
};
const DOC_IDS = Array.from({ length: 30 }, (_, i) => `seed-doc-${String(i+1).padStart(3,'0')}`);
const ALU_IDS = Array.from({ length: 20 }, (_, i) => `seed-alu-${String(i+1).padStart(3,'0')}`);
const PRO_IDS = Array.from({ length: 4 }, (_, i) => `seed-pro-${String(i+1).padStart(3,'0')}`);

// ─── ESCUELAS ────────────────────────────────────────────────
const escuelas = [
  { id: ESC.e1, org_id: ORG_ID, nombre: 'Escuela Primaria N° 14 "República del Perú"', nivel: 'Primaria', color: '#2D6A4F', direccion: 'Av. Corrientes 3400, CABA', eoe: ['Lic. Martínez'], activo: true, eliminado: false },
  { id: ESC.e2, org_id: ORG_ID, nombre: 'Escuela Secundaria N° 7 "Bernardino Rivadavia"', nivel: 'Secundaria', color: '#1565C0', direccion: 'Av. Santa Fe 2100, CABA', eoe: ['Lic. Pereyra', 'Ps. González'], activo: true, eliminado: false },
  { id: ESC.e3, org_id: ORG_ID, nombre: 'Jardín de Infantes N° 3 "El Girasol"', nivel: 'Inicial', color: '#F9A825', direccion: 'Lavalle 890, Ramos Mejía', eoe: [], activo: true, eliminado: false },
  { id: ESC.e4, org_id: ORG_ID, nombre: 'Escuela Especial N° 502 "Nuestros Hijos"', nivel: 'Especial', color: '#6A1B9A', direccion: 'Gral. Paz 4500, San Justo', eoe: ['Lic. Ramírez', 'Ps. Vidal'], activo: true, eliminado: false },
];

// ─── PROFESIONALES EXTERNOS ──────────────────────────────────
const profesionales = [
  { id: PRO_IDS[0], org_id: ORG_ID, nombre: 'Lic. Claudia Fernández', rol: 'Psicóloga', telefono: '11-4523-8901', mail: 'cfernandez@gmail.com', eliminado: false },
  { id: PRO_IDS[1], org_id: ORG_ID, nombre: 'Lic. Roberto Salgado', rol: 'Fonoaudiólogo', telefono: '11-3344-5566', mail: 'rsalgado@fono.com', eliminado: false },
  { id: PRO_IDS[2], org_id: ORG_ID, nombre: 'Lic. Patricia Medina', rol: 'Psicopedagoga', telefono: '11-2255-7788', mail: 'pmedina@psico.com', eliminado: false },
  { id: PRO_IDS[3], org_id: ORG_ID, nombre: 'Dr. Gustavo Torres', rol: 'Neurólogo', telefono: '11-4001-2233', mail: 'gtorres@neuro.com', eliminado: false },
];

// ─── DOCENTES (30) ───────────────────────────────────────────
const materiasP = ['Matemática','Lengua','Ciencias Naturales','Ciencias Sociales','Educación Física','Música','Plástica'];
const materiasS = ['Matemática','Lengua y Literatura','Historia','Geografía','Biología','Física','Química','Inglés','Educación Física','Filosofía'];
const nombresDocentes = [
  'Ana García','Carlos Rodríguez','María López','Jorge Martínez','Laura Sánchez',
  'Pedro González','Silvia Torres','Diego Fernández','Natalia Díaz','Roberto Pérez',
  'Claudia Ruiz','Alejandro Castro','Valeria Romero','Marcelo Suárez','Patricia Moreno',
  'Sebastián Álvarez','Verónica Méndez','Hernán Giménez','Florencia Acosta','Ricardo Molina',
  'Stella Vega','Pablo Reyes','Daniela Herrera','Maximiliano Flores','Cecilia Medina',
  'Ignacio Sosa','Mirta Cabrera','Fernando Rojas','Adriana Quiroga','Néstor Vargas',
];
const escDocente = [ESC.e1,ESC.e1,ESC.e1,ESC.e1,ESC.e1,ESC.e1,ESC.e1, // 7 en primaria
                    ESC.e2,ESC.e2,ESC.e2,ESC.e2,ESC.e2,ESC.e2,ESC.e2,ESC.e2,ESC.e2,ESC.e2, // 10 en secundaria
                    ESC.e3,ESC.e3,ESC.e3,ESC.e3, // 4 en inicial
                    ESC.e4,ESC.e4,ESC.e4,ESC.e4,ESC.e4, // 5 en especial
                    null,null,null,null,null]; // 4 sin escuela (externos)
const docentes = nombresDocentes.map((nombre, i) => {
  const escId = escDocente[i];
  const materias = escId === ESC.e2 ? materiasS : materiasP;
  return {
    id: DOC_IDS[i],
    org_id: ORG_ID,
    nombre,
    materia: materias[i % materias.length],
    escuela_id: escId,
    telefono: `11-${String(4000+i*17).padStart(4,'0')}-${String(1000+i*31).padStart(4,'0')}`,
    mail: `${nombre.toLowerCase().replace(/\s+/g,'').replace(/[áéíóú]/g,c=>({á:'a',é:'e',í:'i',ó:'o',ú:'u'})[c]||c)}@edu.ar`,
    eliminado: false,
  };
});

// ─── ALUMNOS (20) ────────────────────────────────────────────
const nombresAlumnos = [
  'Tomás Aguirre','Valentina Blanco','Mateo Carrizo','Lucía Delgado','Santiago Espinoza',
  'Camila Ferreyra','Benjamín Godoy','Sofía Heredia','Lucas Ibáñez','Martina Juárez',
  'Nicolás Leiva','Emma Maldonado','Facundo Navarro','Isabella Ojeda','Agustín Peralta',
  'Victoria Quintero','Thiago Ríos','Valentina Solís','Ezequiel Tapia','Renata Urquiza',
];
const diagnosticos = [
  'TEA nivel 1','TDAH','Dificultades en lectoescritura','TEA nivel 2','Hipoacusia leve',
  'Síndrome de Down','Dificultades de aprendizaje','TEA nivel 1','TDAH con impulsividad','Baja visión',
  'Retraso madurativo','TEA nivel 2','Dificultades en matemática','Parálisis cerebral leve','TDAH',
  'Dificultades de aprendizaje','TEA nivel 1','Síndrome de Down','Discapacidad intelectual leve','TEA nivel 2',
];
const escAlumno = [ESC.e1,ESC.e1,ESC.e1,ESC.e1,ESC.e1, // 5 en primaria
                   ESC.e2,ESC.e2,ESC.e2,ESC.e2,ESC.e2, // 5 en secundaria
                   ESC.e3,ESC.e3,ESC.e3,ESC.e3,         // 4 en inicial
                   ESC.e4,ESC.e4,ESC.e4,ESC.e4,ESC.e4,ESC.e4]; // 6 en especial
const cursos = ['1°A','2°B','3°A','4°B','5°A','1°C','2°A','3°B','Sala 3','Sala 4','Sala 5','1°','2°','3°','4°'];
const obrasS = ['OSDE','PAMI','IOMA','Galeno','Swiss Medical','Sin cobertura'];

const alumnos = nombresAlumnos.map((nombre, i) => {
  const escId = escAlumno[i];
  const docsDeEscuela = DOC_IDS.filter((_, di) => escDocente[di] === escId);
  return {
    id: ALU_IDS[i],
    org_id: ORG_ID,
    nombre,
    escuela_id: escId,
    curso: cursos[i % cursos.length],
    diagnostico: diagnosticos[i],
    horarios: [
      { dia: 'Lunes', horaInicio: '08:00', horaFin: '10:00', docente: docsDeEscuela[0] || '', actividad: 'Apoyo escolar' },
      { dia: 'Miércoles', horaInicio: '09:00', horaFin: '11:00', docente: docsDeEscuela[1] || docsDeEscuela[0] || '', actividad: 'Integración' },
    ],
    tutores: [{ nombre: `Tutor de ${nombre.split(' ')[0]}`, vinculo: i % 2 === 0 ? 'Madre' : 'Padre', telefono: `11-9${String(i).padStart(3,'0')}-4567` }],
    terapias: i % 3 === 0 ? ['Psicología','Fonoaudiología'] : i % 3 === 1 ? ['Psicopedagogía'] : ['Terapia Ocupacional'],
    profesional_ids: [PRO_IDS[i % 4]],
    cud: i % 4 === 0,
    cud_vencimiento: i % 4 === 0 ? '2025-12-31' : null,
    activo: true,
    eliminado: false,
    salud: {
      obraSocial: obrasS[i % obrasS.length],
      nroAfiliado: `${100000 + i * 1337}`,
      medicacion: i % 5 === 0 ? 'Metilfenidato 10mg' : '',
      obs: 'Requiere acompañamiento en actividades grupales.',
      trayectoria: [],
      direccion: `Calle ${100+i} N° ${200+i*3}, CABA`,
      telefonoCasa: `11-4${String(i).padStart(3,'0')}-9876`,
    },
    fecha_nacimiento: `${2010 + (i % 6)}-${String((i % 12)+1).padStart(2,'0')}-${String((i % 28)+1).padStart(2,'0')}`,
    dni: String(45000000 + i * 137),
  };
});

// ─── REGISTROS (muchos por alumno) ──────────────────────────
function generarRegistros() {
  const registros = [];
  const materiasPorAlu = ['Matemática','Lengua','Ciencias','Integración','Apoyo escolar'];
  const asistencias = ['presente','ausente','presente','presente','tarde'];
  const avances = [
    'Trabajó muy bien, logró resolver las consignas con apoyo mínimo.',
    'Se mostró disperso al inicio pero luego se concentró. Avanzó en lectura.',
    'Excelente sesión. Resolvió ejercicios de suma con material concreto.',
    'Requirió bastante acompañamiento. Se sugiere reforzar en casa.',
    'Participó activamente. Mostró progreso en comprensión lectora.',
    'Dificultad para sostener la atención. Se trabajó con tiempos cortos.',
    'Logró completar la tarea de forma autónoma por primera vez.',
    'Buen vínculo con la docente. Trabajó en secuencia temporal.',
    'Se resistió al inicio. Luego accedió y participó bien.',
    'Muy buena predisposición. Superó el objetivo del día.',
  ];
  const acuerdos = [
    'Continuar con ejercicios de suma llevando.',
    'Traer el libro de lectura la próxima semana.',
    'Practicar en casa 15 min diarios de lectura.',
    'Confirmar turno con la psicóloga.',
    'Trabajar secuencia numérica hasta el 100.',
    '',
    'Revisar cuaderno con la familia.',
    'Solicitar informe a fonoaudiología.',
    '',
    'Avanzar con texto narrativo corto.',
  ];

  ALU_IDS.forEach((aluId, ai) => {
    const docsEsc = DOC_IDS.filter((_, di) => escDocente[di] === escAlumno[ai]);
    const cantRegistros = 8 + (ai % 7); // entre 8 y 14 registros por alumno

    for (let r = 0; r < cantRegistros; r++) {
      const daysAgo = r * 7 + Math.floor(Math.random() * 5);
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - daysAgo);
      const fechaStr = fecha.toISOString().split('T')[0];

      registros.push({
        id: `seed-reg-${aluId}-${r}`,
        org_id: ORG_ID,
        alumno_id: aluId,
        fecha: fechaStr,
        materia: materiasPorAlu[r % materiasPorAlu.length],
        asistencia: asistencias[r % asistencias.length],
        avance: avances[r % avances.length],
        acuerdo: acuerdos[r % acuerdos.length],
        docente: docsEsc[r % Math.max(docsEsc.length, 1)] || DOC_IDS[r % DOC_IDS.length],
        tipo: r % 5 === 0 ? 'informe' : 'clase',
        eliminado: false,
      });
    }
  });
  return registros;
}

// ─── INSERTAR ────────────────────────────────────────────────
async function insertar() {
  console.log('📚 Insertando escuelas...');
  const r1 = await supabase.from('escuelas').upsert(escuelas);
  if (r1.error) { console.error('❌ escuelas:', r1.error.message); return; }
  console.log(`   ✅ ${escuelas.length} escuelas`);

  console.log('👔 Insertando profesionales...');
  const r2 = await supabase.from('profesionales').upsert(profesionales);
  if (r2.error) { console.error('❌ profesionales:', r2.error.message); return; }
  console.log(`   ✅ ${profesionales.length} profesionales`);

  console.log('👩‍🏫 Insertando docentes...');
  const r3 = await supabase.from('docentes').upsert(docentes);
  if (r3.error) { console.error('❌ docentes:', r3.error.message); return; }
  console.log(`   ✅ ${docentes.length} docentes`);

  console.log('👤 Insertando alumnos...');
  const r4 = await supabase.from('alumnos').upsert(alumnos);
  if (r4.error) { console.error('❌ alumnos:', r4.error.message); return; }
  console.log(`   ✅ ${alumnos.length} alumnos`);

  const registros = generarRegistros();
  console.log(`📝 Insertando ${registros.length} registros...`);
  // Insertar en lotes de 500
  for (let i = 0; i < registros.length; i += 500) {
    const lote = registros.slice(i, i + 500);
    const r5 = await supabase.from('registros').upsert(lote);
    if (r5.error) { console.error('❌ registros lote:', r5.error.message); return; }
    console.log(`   ✅ lote ${Math.floor(i/500)+1} (${lote.length} registros)`);
  }

  console.log('\n🎉 ¡Datos de prueba cargados correctamente!');
  console.log(`   4 escuelas, ${docentes.length} docentes, ${alumnos.length} alumnos, 4 profesionales, ${registros.length} registros`);
  console.log('\nPara borrar todo: node seed_test_data.js --borrar');
}

// ─── BORRAR ──────────────────────────────────────────────────
async function borrar() {
  console.log('🗑️  Borrando datos de prueba...');

  const regIds = ALU_IDS.flatMap((aluId) =>
    Array.from({ length: 15 }, (_, r) => `seed-reg-${aluId}-${r}`)
  );
  const r1 = await supabase.from('registros').delete().in('id', regIds);
  console.log('   registros:', r1.error ? '❌ ' + r1.error.message : '✅');

  const r2 = await supabase.from('alumnos').delete().in('id', ALU_IDS);
  console.log('   alumnos:', r2.error ? '❌ ' + r2.error.message : '✅');

  const r3 = await supabase.from('docentes').delete().in('id', DOC_IDS);
  console.log('   docentes:', r3.error ? '❌ ' + r3.error.message : '✅');

  const r4 = await supabase.from('profesionales').delete().in('id', PRO_IDS);
  console.log('   profesionales:', r4.error ? '❌ ' + r4.error.message : '✅');

  const r5 = await supabase.from('escuelas').delete().in('id', Object.values(ESC));
  console.log('   escuelas:', r5.error ? '❌ ' + r5.error.message : '✅');

  console.log('\n✅ Datos de prueba eliminados.');
}

// ─── MAIN ────────────────────────────────────────────────────
if (BORRAR) borrar().catch(console.error);
else insertar().catch(console.error);
