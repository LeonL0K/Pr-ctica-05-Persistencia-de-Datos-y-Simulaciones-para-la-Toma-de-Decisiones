// Joel Iván Juárez León
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
// 1. BASE DE DATOS LOCAL (LocalStorage)
// ============================================================
const ESPECIES = [
  { id: 1, nombre: 'Maíz', agua_optima: 70, temp_optima: 28, r_max: 0.22, k_max: 120, dias_madurez: 100 },
  { id: 2, nombre: 'Frijol', agua_optima: 60, temp_optima: 22, r_max: 0.18, k_max: 80, dias_madurez: 85 },
  { id: 3, nombre: 'Jitomate', agua_optima: 65, temp_optima: 24, r_max: 0.25, k_max: 150, dias_madurez: 110 },
  { id: 4, nombre: 'Arabidopsis', agua_optima: 55, temp_optima: 20, r_max: 0.35, k_max: 30, dias_madurez: 45 }
];

if (!localStorage.getItem('simulaciones_db')) {
  localStorage.setItem('simulaciones_db', JSON.stringify([]));
}

function guardarEnBD(sim) {
  const db = JSON.parse(localStorage.getItem('simulaciones_db'));
  db.push(sim);
  localStorage.setItem('simulaciones_db', JSON.stringify(db));
}

// ============================================================
// 2. MODELOS MATEMÁTICOS
// ============================================================
const modelos = {
  lineal: (t, N0, r, K) => Math.min(K, N0 + (K * 0.05) * t),
  exponencial: (t, N0, r, K) => Math.min(K, N0 * Math.exp(r * 0.1 * t)),
  logistico: (t, N0, r, K) => K / (1 + ((K - N0) / N0) * Math.exp(-r * 0.15 * t)),
  gompertz: (t, N0, r, K) => K * Math.exp(-Math.exp(-r * 0.15 * (t - 30)))
};

// ============================================================
// 3. ESCENA THREE.JS
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8d8e8);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
const camaraInicial = new THREE.Vector3(0, 8, 14);
camera.position.copy(camaraInicial);
camera.lookAt(0, 3, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 3, 0);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sol = new THREE.DirectionalLight(0xfff2cc, 1.5);
sol.position.set(10, 20, 10);
sol.castShadow = true;
scene.add(sol);

// Suelo
const suelo = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 1 })
);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
scene.add(suelo);

// ============================================================
// 4. MODELOS 3D ESPECÍFICOS
// ============================================================
function crearElote() {
  const grupo = new THREE.Group();
  
  // Cuerpo amarillo
  const mazorca = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.7, 12),
    new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.5 })
  );
  mazorca.position.y = 0.35;
  mazorca.castShadow = true;
  grupo.add(mazorca);

  // Hojas verdes en la base
  for (let i = 0; i < 4; i++) {
    const huskGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
    const husk = new THREE.Mesh(huskGeo, new THREE.MeshStandardMaterial({ color: 0x81c784 }));
    const ang = (i * Math.PI * 2) / 4;
    husk.position.set(Math.cos(ang) * 0.1, 0.15, Math.sin(ang) * 0.1);
    husk.rotation.z = Math.cos(ang) * 0.3;
    husk.rotation.x = Math.sin(ang) * 0.3;
    grupo.add(husk);
  }
  return grupo;
}

function crearPlantaMaiz(xOffset) {
  const grupo = new THREE.Group();
  grupo.position.set(xOffset, 0, 0);

  // Maceta Azul
  const maceta = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 0.75, 1.2, 24),
    new THREE.MeshStandardMaterial({ color: 0x2196f3 })
  );
  maceta.position.y = 0.6;
  maceta.castShadow = true;
  maceta.name = 'Maceta Azul (Maíz)';
  grupo.add(maceta);

  const talloGrupo = new THREE.Group();
  talloGrupo.position.y = 1.2;
  grupo.add(talloGrupo);

  // Tallo
  const talloGeo = new THREE.CylinderGeometry(0.1, 0.15, 6, 12);
  talloGeo.translate(0, 3, 0);
  const tallo = new THREE.Mesh(talloGeo, new THREE.MeshStandardMaterial({ color: 0x3a8a3a }));
  tallo.castShadow = true;
  tallo.name = 'Tallo de Maíz';
  talloGrupo.add(tallo);

  const partes = [{ mesh: tallo, tipo: 'Tallo', rango: [0, 1.0] }];

  // Hojas largas
  for (let i = 0; i < 6; i++) {
    const alturaBase = 0.8 + i * 0.8;
    const ang = (i * Math.PI * 2) / 6;

    const hojaPivote = new THREE.Group();
    hojaPivote.position.set(0, alturaBase, 0); // Anclado al centro del tallo
    hojaPivote.rotation.y = ang;
    hojaPivote.rotation.z = Math.PI / 3.5; // Cuelgan
    talloGrupo.add(hojaPivote);

    const hojaGeo = new THREE.BoxGeometry(0.05, 2.5, 0.4);
    hojaGeo.translate(0, 1.25, 0);
    const hoja = new THREE.Mesh(hojaGeo, new THREE.MeshStandardMaterial({ color: 0x4caf50 }));
    hoja.castShadow = true;
    hoja.name = 'Hoja de Maíz';
    hojaPivote.add(hoja);

    // Guardamos alturaBase para que se mueva con el tallo
    partes.push({ mesh: hojaPivote, tipo: 'Hoja', rango: [0.1 + i*0.05, 0.4 + i*0.05], baseY: alturaBase });
  }

  // 3 Elotes
  for (let i = 0; i < 3; i++) {
    const alturaBase = 2.5 + i * 1.2;
    const elotePivote = new THREE.Group();
    elotePivote.position.set(0, alturaBase, 0); 
    elotePivote.rotation.z = -Math.PI / 4; 
    talloGrupo.add(elotePivote);

    const elote = crearElote();
    elote.position.y = 0.1; 
    elotePivote.add(elote);

    partes.push({ mesh: elotePivote, tipo: 'Fruto', rango: [0.6 + i*0.1, 0.8 + i*0.1], baseY: alturaBase });
  }

  partes.forEach(p => p.mesh.visible = false);
  scene.add(grupo);
  return { grupo, talloGrupo, partes };
}

function crearPlantaJitomate(xOffset) {
  const grupo = new THREE.Group();
  grupo.position.set(xOffset, 0, 0);

  // Maceta Naranja
  const maceta = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 0.75, 1.2, 24),
    new THREE.MeshStandardMaterial({ color: 0xff9800 })
  );
  maceta.position.y = 0.6;
  maceta.castShadow = true;
  maceta.name = 'Maceta Naranja (Jitomate)';
  grupo.add(maceta);

  const talloGrupo = new THREE.Group();
  talloGrupo.position.y = 1.2;
  grupo.add(talloGrupo);

  // Tallo
  const talloGeo = new THREE.CylinderGeometry(0.08, 0.12, 5, 12);
  talloGeo.translate(0, 2.5, 0);
  const tallo = new THREE.Mesh(talloGeo, new THREE.MeshStandardMaterial({ color: 0x2e7d32 }));
  tallo.castShadow = true;
  tallo.name = 'Tallo de Jitomate';
  talloGrupo.add(tallo);

  const partes = [{ mesh: tallo, tipo: 'Tallo', rango: [0, 1.0] }];

  // Ramas con hojas y jitomates
  for (let i = 0; i < 5; i++) {
    const alturaBase = 1 + i * 0.8;
    const ang = (i * Math.PI * 2) / 5;

    const ramaPivote = new THREE.Group();
    ramaPivote.position.set(0, alturaBase, 0); // Anclado al tallo
    ramaPivote.rotation.y = ang;
    ramaPivote.rotation.z = -Math.PI / 4; 
    talloGrupo.add(ramaPivote);

    // Ramita
    const ramaGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.2, 8);
    ramaGeo.translate(0, 0.6, 0); 
    const rama = new THREE.Mesh(ramaGeo, new THREE.MeshStandardMaterial({ color: 0x2e7d32 }));
    rama.castShadow = true;
    ramaPivote.add(rama);

    // Hoja redonda
    const hojaGeo = new THREE.SphereGeometry(0.35, 12, 10);
    hojaGeo.scale(1.5, 0.1, 1); 
    const hoja = new THREE.Mesh(hojaGeo, new THREE.MeshStandardMaterial({ color: 0x4caf50, side: THREE.DoubleSide }));
    hoja.position.set(0, 1.2, 0); 
    hoja.castShadow = true;
    hoja.name = 'Hoja de Jitomate';
    ramaPivote.add(hoja);

    // Jitomate rojo colgando
    const jitomate = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.3 })
    );
    jitomate.position.set(0, 0.8, 0.2); 
    jitomate.castShadow = true;
    jitomate.name = 'Jitomate';
    ramaPivote.add(jitomate);

    // Guardamos alturaBase para que se mueva con el tallo
    partes.push({ mesh: ramaPivote, tipo: 'Rama', rango: [0.2 + i*0.1, 0.5 + i*0.1], baseY: alturaBase });
  }

  partes.forEach(p => p.mesh.visible = false);
  scene.add(grupo);
  return { grupo, talloGrupo, partes };
}

const plantaA = crearPlantaMaiz(-3.5);
const plantaB = crearPlantaJitomate(3.5);

// ============================================================
// 5. LÓGICA DE SIMULACIÓN Y CRECIMIENTO
// ============================================================
let simActiva = false;
let diaA = 0, diaB = 0;
let vel = 1;

function calcularEstres(especie, agua, temp) {
  const devAgua = Math.min(100, Math.abs(agua - especie.agua_optima) * 2);
  const devTemp = Math.min(100, Math.abs(temp - especie.temp_optima) * 6);
  return { hidrico: devAgua, termico: devTemp, total: (devAgua + devTemp) / 2 };
}

function actualizarPlantaVisual(planta, progreso, factorEstres) {
  // 1. Calcular el crecimiento del tallo primero
  const talloPart = planta.partes.find(p => p.tipo === 'Tallo');
  const [iniT, finT] = talloPart.rango;
  const localT = (progreso - iniT) / (finT - iniT);
  const clampedT = Math.max(0, Math.min(1, localT));
  const suaveT = 1 - Math.pow(1 - clampedT, 3);
  const sTallo = 0.001 + (suaveT * 0.999) * factorEstres;

  // 2. Actualizar cada parte
  planta.partes.forEach(p => {
    const [ini, fin] = p.rango;
    const local = (progreso - ini) / (fin - ini);
    const clamped = Math.max(0, Math.min(1, local));
    const suave = 1 - Math.pow(1 - clamped, 3);
    
    const s = 0.001 + (suave * 0.999) * factorEstres;

    if (p.tipo === 'Tallo') {
      p.mesh.scale.set(1, sTallo, 1); // El tallo solo crece hacia arriba
    } else {
      p.mesh.scale.set(s, s, s); // Hojas y frutos crecen en todas direcciones
      
      // ¡EL TRUCO! Movemos la rama hacia arriba o abajo según el tamaño del tallo
      if (p.baseY !== undefined) {
        p.mesh.position.y = p.baseY * sTallo;
      }
    }
    
    p.mesh.visible = s > 0.02;
  });
}

// Chart.js
const ctx = document.getElementById('grafica').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Biomasa A', data: [], borderColor: '#2196f3', tension: 0.3 },
      { label: 'Biomasa B', data: [], borderColor: '#ff9800', tension: 0.3 }
    ]
  },
  options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#a8e0a8' } }, y: { ticks: { color: '#a8e0a8' } } }, plugins: { legend: { labels: { color: '#fff' } } } }
});

function stepSimulacion() {
  if (!simActiva) return;

  const espA = ESPECIES.find(e => e.id == document.getElementById('especie-a').value);
  const espB = ESPECIES.find(e => e.id == document.getElementById('especie-b').value);
  
  const modA = document.getElementById('modelo-a').value;
  const modB = document.getElementById('modelo-b').value;

  const aguaA = parseFloat(document.getElementById('agua-a').value);
  const tempA = parseFloat(document.getElementById('temp-a').value);
  const aguaB = parseFloat(document.getElementById('agua-b').value);
  const tempB = parseFloat(document.getElementById('temp-b').value);

  const estA = calcularEstres(espA, aguaA, tempA);
  const estB = calcularEstres(espB, aguaB, tempB);

  const fEstA = 1 - (estA.total / 100) * 0.7;
  const fEstB = 1 - (estB.total / 100) * 0.7;

  const bioA = modelos[modA](diaA, 1, espA.r_max, espA.k_max);
  const bioB = modelos[modB](diaB, 1, espB.r_max, espB.k_max);

  const progA = Math.min(1, diaA / espA.dias_madurez);
  const progB = Math.min(1, diaB / espB.dias_madurez);

  actualizarPlantaVisual(plantaA, progA, fEstA);
  actualizarPlantaVisual(plantaB, progB, fEstB);

  document.getElementById('k-dia-a').textContent = diaA;
  document.getElementById('k-dia-b').textContent = diaB;
  document.getElementById('k-bio-a').textContent = bioA.toFixed(1);
  document.getElementById('k-bio-b').textContent = bioB.toFixed(1);
  document.getElementById('k-alt-a').textContent = (progA * 10 * fEstA).toFixed(1);
  document.getElementById('k-alt-b').textContent = (progB * 10 * fEstB).toFixed(1);
  document.getElementById('k-eh-a').textContent = estA.hidrico.toFixed(0);
  document.getElementById('k-eh-b').textContent = estB.hidrico.toFixed(0);
  document.getElementById('k-et-a').textContent = estA.termico.toFixed(0);
  document.getElementById('k-et-b').textContent = estB.termico.toFixed(0);

  const accionA = estA.total > 30 ? `⚠️ ${estA.hidrico > estA.termico ? 'Aumentar riego' : 'Ajustar temperatura'}` : '✅ Óptimo';
  const accionB = estB.total > 30 ? `⚠️ ${estB.hidrico > estB.termico ? 'Aumentar riego' : 'Ajustar temperatura'}` : '✅ Óptimo';
  document.getElementById('dec-a').innerHTML = `<b>Planta A:</b> ${accionA} (Estrés: ${estA.total.toFixed(0)})`;
  document.getElementById('dec-b').innerHTML = `<b>Planta B:</b> ${accionB} (Estrés: ${estB.total.toFixed(0)})`;

  const ganadorTxt = bioA > bioB ? '🏆 Planta A va ganando' : (bioB > bioA ? '🏆 Planta B va ganando' : '🤝 Empate');
  document.getElementById('ganador').textContent = ganadorTxt;

  if (diaA % 3 === 0) {
    chart.data.labels.push(diaA);
    chart.data.datasets[0].data.push(bioA);
    chart.data.datasets[1].data.push(bioB);
    chart.update('none');
  }

  diaA++; diaB++;
}

// ============================================================
// 6. CONTROLES Y UI
// ============================================================
const selA = document.getElementById('especie-a');
const selB = document.getElementById('especie-b');
ESPECIES.forEach(e => {
  const opt = `<option value="${e.id}">${e.nombre}</option>`;
  selA.innerHTML += opt;
  selB.innerHTML += opt;
});
selA.value = 1; // Maíz
selB.value = 3; // Jitomate

document.getElementById('btn-play').addEventListener('click', (e) => {
  simActiva = !simActiva;
  e.target.textContent = simActiva ? '⏸ Pausar' : '▶ Reanudar';
});

document.getElementById('btn-reiniciar').addEventListener('click', () => {
  diaA = 0; diaB = 0; simActiva = false;
  document.getElementById('btn-play').textContent = '▶ Iniciar Simulación';
  chart.data.labels = [];
  chart.data.datasets.forEach(d => d.data = []);
  chart.update();
  actualizarPlantaVisual(plantaA, 0, 1);
  actualizarPlantaVisual(plantaB, 0, 1);
});

document.getElementById('velocidad').addEventListener('input', (e) => {
  vel = parseFloat(e.target.value);
  document.getElementById('vel-val').textContent = vel.toFixed(1);
});

document.getElementById('btn-guardar').addEventListener('click', () => {
  const espA = ESPECIES.find(e => e.id == selA.value);
  const espB = ESPECIES.find(e => e.id == selB.value);
  
  guardarEnBD({
    fecha: new Date().toLocaleString(),
    especieA: espA.nombre, biomasaA: parseFloat(document.getElementById('k-bio-a').textContent),
    especieB: espB.nombre, biomasaB: parseFloat(document.getElementById('k-bio-b').textContent)
  });
  alert('✅ Datos de simulación A/B guardados en LocalStorage.');
});

document.getElementById('btn-reportes').addEventListener('click', () => {
  const db = JSON.parse(localStorage.getItem('simulaciones_db'));
  const cont = document.getElementById('tabla-reportes');
  
  if (db.length === 0) {
    cont.innerHTML = '<p>No hay simulaciones guardadas aún.</p>';
  } else {
    cont.innerHTML = `
      <table>
        <tr><th>Fecha</th><th>Especie A</th><th>Biomasa A</th><th>Especie B</th><th>Biomasa B</th></tr>
        ${db.map(s => `<tr><td>${s.fecha}</td><td>${s.especieA}</td><td>${s.biomasaA}</td><td>${s.especieB}</td><td>${s.biomasaB}</td></tr>`).join('')}
      </table>
    `;
  }
  document.getElementById('modal-reportes').style.display = 'block';
});

// Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickables = [];
plantaA.partes.forEach(p => clickables.push(p.mesh));
plantaB.partes.forEach(p => clickables.push(p.mesh));

addEventListener('click', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickables, true);

  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj && !clickables.includes(obj)) {
      obj = obj.parent;
    }
    
    if (obj) {
      const esA = plantaA.partes.some(p => p.mesh === obj);
      const bio = parseFloat(document.getElementById(esA ? 'k-bio-a' : 'k-bio-b').textContent);
      
      document.getElementById('info-nombre').textContent = obj.name + (esA ? ' (Planta A)' : ' (Planta B)');
      document.getElementById('info-tipo').textContent = obj.geometry ? obj.geometry.type : 'Grupo';
      document.getElementById('info-progreso').textContent = (esA ? diaA : diaB) + ' días';
      document.getElementById('info-biomasa').textContent = (bio / 5).toFixed(2) + ' g (aprox)';
      document.getElementById('info-estres').textContent = (esA ? document.getElementById('k-eh-a').textContent : document.getElementById('k-eh-b').textContent) + ' (hídrico)';
    }
  }
});

// Bucle Principal
const clock = new THREE.Clock();
let tiempoAcum = 0;

actualizarPlantaVisual(plantaA, 0, 1);
actualizarPlantaVisual(plantaB, 0, 1);

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  plantaA.talloGrupo.rotation.z = Math.sin(t * 1.6) * 0.05;
  plantaB.talloGrupo.rotation.z = Math.cos(t * 1.4) * 0.05;

  if (simActiva) {
    tiempoAcum += dt * vel;
    if (tiempoAcum > 0.5) { 
      stepSimulacion();
      tiempoAcum = 0;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});