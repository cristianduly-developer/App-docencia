// ─── Temas de color ───────────────────────────────────────────
export const TEMAS_COLOR = [
  { hex:'#2D6A4F', dark:'#1a3a2a', label:'Verde'      },
  { hex:'#1D4ED8', dark:'#1e3a8a', label:'Azul'       },
  { hex:'#EC4899', dark:'#9d174d', label:'Rosa claro' },
  { hex:'#BE185D', dark:'#831843', label:'Rosa'       },
  { hex:'#6D28D9', dark:'#4c1d95', label:'Violeta'    },
  { hex:'#1E293B', dark:'#0f172a', label:'Negro'      },
];

// ─── Colores activos (leen localStorage al iniciar) ───────────
export const G   = localStorage.getItem('aye_color_tema') || "#2D6A4F";
export const GD  = localStorage.getItem('aye_color_dark') || "#1a3a2a";
export const GR  = "#64748b";
export const GL  = "#94a3b8";
export const BD  = "#e2e8f0";
export const TX  = "#1a202c";
export const FO  = "#f1f5f9";

// ─── Plan limits ──────────────────────────────────────────────
export const LIMITE_ALUMNOS = { basico: 15, profesional: 25, premium: Infinity };

// ─── Días de la semana ────────────────────────────────────────
export const DIAS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
export const DIAS_L = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

// ─── Session key ──────────────────────────────────────────────
export const SESSION_KEY = "aye_session_v2";

// ─── Google Client ID ─────────────────────────────────────────
export const GOOGLE_CLIENT_ID = "117583093488-94tk32l3502mj4c3vff7fci9oclcvvhn.apps.googleusercontent.com";

// ─── Demo data ────────────────────────────────────────────────
export const ESC_DEF = [
  {
    id:"e1", nombre:"Escuela Primaria N°12", nivel:"Primaria", color:"#2D6A4F",
    director:"Lic. Marta Suárez", telefonoDirector:"011-4567-8901", mailDirector:"msuarez@ep12.edu.ar",
    direccion:"Av. Corrientes 1234, CABA",
    secretaria:"Sra. Rosa Fernández", telefonoSecretaria:"011-4567-8900", mailSecretaria:"secretaria@ep12.edu.ar",
    eoe:[
      {id:"eoe1",nombre:"Lic. Carmen Vidal",   rol:"Orientadora Educacional",      telefono:"11-4455-1122",mail:"cvidal@ep12.edu.ar",   diasPresencia:"Lunes y Miércoles",  eliminado:false},
      {id:"eoe2",nombre:"Lic. Graciela Torres",rol:"Orientadora Social",            telefono:"11-4455-2233",mail:"gtorres@ep12.edu.ar",  diasPresencia:"Martes y Jueves",    eliminado:false},
    ],
    eliminado:false,
  },
  {
    id:"e2", nombre:"Escuela Secundaria N°7", nivel:"Secundaria", color:"#1D3557",
    director:"Prof. Carlos Mendez", telefonoDirector:"011-4567-8902", mailDirector:"cmendez@es7.edu.ar",
    direccion:"Calle Mitre 890, CABA",
    secretaria:"Sr. Pablo Gómez", telefonoSecretaria:"011-4567-8903", mailSecretaria:"secretaria@es7.edu.ar",
    eoe:[
      {id:"eoe4",nombre:"Lic. Marcela Ruiz",  rol:"Orientadora de los Aprendizajes",telefono:"11-5566-1122",mail:"mruiz@es7.edu.ar",   diasPresencia:"Lun, Mié y Vie",     eliminado:false},
    ],
    eliminado:false,
  },
];

export const DOC_DEF = [
  {id:"d1",nombre:"Prof. Ana Gómez",    materia:"Matemática",   telefono:"11-2233-4455",mail:"agomez@ep12.edu.ar",  escuelaId:"e1",eliminado:false},
  {id:"d2",nombre:"Prof. Luis Pérez",   materia:"Lengua",       telefono:"11-2233-5566",mail:"lperez@ep12.edu.ar",  escuelaId:"e1",eliminado:false},
  {id:"d4",nombre:"Prof. Rodrigo Vega", materia:"Historia",     telefono:"11-4455-7788",mail:"rvega@es7.edu.ar",    escuelaId:"e2",eliminado:false},
  {id:"d5",nombre:"Prof. Valeria Soto", materia:"Matemática",   telefono:"11-5566-8899",mail:"vsoto@es7.edu.ar",    escuelaId:"e2",eliminado:false},
];

export const PRO_DEF = [
  {id:"p1",nombre:"Lic. Paula Herrera",  rol:"Psicóloga",     telefono:"11-1122-3344",mail:"paula.herrera@gmail.com",  eliminado:false},
  {id:"p2",nombre:"Lic. Diego Morales",  rol:"Fonoaudiólogo", telefono:"11-2233-4455",mail:"diego.morales@gmail.com",  eliminado:false},
];

export const ALU_DEF = [
  { id:"a1", nombre:"Sofía Martínez", escuelaId:"e1", curso:"3° A", dni:"50.234.871", cuil:"20-50234871-3", fechaNacimiento:"2016-03-14",
    direccion:"Av. Rivadavia 2340 Piso 3B", telefonoCasa:"011-4567-1234",
    cud:true, cudNumero:"CUD-2023-00412", cudVencimiento:"2026-12-31",
    tutores:[{nombre:"María Martínez",relacion:"Mamá",telefono:"11-9988-7766",principal:true}],
    diagnostico:"TEA - Nivel 1", obraSocial:"OSDE", nroAfiliado:"1234567-01",
    medicacion:"Risperidona 0.5mg (mañana)",
    terapias:[{nombre:"Fonoaudiología",frecuencia:"2x semana",profesional:"Lic. Diego Morales"}],
    trayectoria:[{ciclo:"2025",institucion:"Escuela Primaria N°12",nivel:"3° grado",notas:"Año en curso."}],
    profesionalIds:["p1","p2"],
    horarios:[
      {dia:1,horaInicio:"08:00",horaFin:"09:00",docenteId:"d1",aula:"Aula 3A",esRecreo:false},
      {dia:1,horaInicio:"09:00",horaFin:"10:00",docenteId:"d2",aula:"Aula 3A",esRecreo:false},
      {dia:3,horaInicio:"08:00",horaFin:"09:00",docenteId:"d1",aula:"Aula 3A",esRecreo:false},
    ],eliminado:false },
];

export const REG_DEF = {};
export const REC_DEF = [];
