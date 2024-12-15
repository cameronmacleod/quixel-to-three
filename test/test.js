/*
  Demo of PBR resources converted from Quixel to Three.js.
*/
let clock, camera, scene, renderer, controls, loader, exrLoader, lights, mesh, material;
let light, light2, backLight;
let gui;
let ambientLight;
const CONTROLS_STATE_KEY = 'threeJsControlsState';

const assetSample = 'wood_ui2leaxlw/ui2leaxlw_4K';

let textureRepeatX = 8;
let textureRepeatY = 4;

const generateMaterial = () => {
  console.log('Loading converted textures...');
  
  // Create a base material with all properties initialized
  material = new THREE.MeshStandardMaterial({
    metalness: 0.8,
    roughness: 0.7,
    envMapIntensity: 0.5,
    aoMapIntensity: 1.0,
    displacementScale: 1,
  });

  // Load converted textures
  loader.load(
    `${assetSample}_t3map.jpg`,  // Converted albedo
    (texture) => {
      console.log('Setting up albedo texture tiling');
      texture.repeat.set(textureRepeatX, textureRepeatY);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    (error) => console.error('Albedo error:', error)
  );

  loader.load(
    `${assetSample}_t3normal.jpg`,  // Converted normal
    (texture) => {
      console.log('✓ Converted normal loaded');
      texture.repeat.set(textureRepeatX, textureRepeatY);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      material.normalMap = texture;
      material.needsUpdate = true;
    },
    undefined,
    (error) => console.error('✗ Converted normal error:', error)
  );

  // Load PBR texture (combines roughness, metalness, and AO)
  loader.load(
    `${assetSample}_t3pbr.jpg`,  // Converted PBR
    (texture) => {
      console.log('✓ Converted PBR loaded');
      texture.repeat.set(textureRepeatX, textureRepeatY);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      material.roughnessMap = texture;
      material.metalnessMap = texture;
      material.aoMap = texture;
      texture.encoding = THREE.LinearEncoding;
      material.needsUpdate = true;
    },
    undefined,
    (error) => console.error('✗ Converted PBR error:', error)
  );

  // Make displacement map loading optional
  try {
    loader.load(
      `${assetSample}_t3displacement.jpg`,
      (texture) => {
        console.log('✓ Converted displacement loaded');
        texture.repeat.set(textureRepeatX, textureRepeatY);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        material.displacementMap = texture;
        material.displacementScale = 0.1;
        material.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.log('No displacement map found - this is OK for some materials');
      }
    );
  } catch (error) {
    console.log('Displacement map not available for this material');
  }

  return material;
};

const init = () => {
  clock = new THREE.Clock();
  
  loader = new THREE.TextureLoader();
  exrLoader = new THREE.EXRLoader();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, .01, 100);
  camera.position.set(0, 2.5, 5);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.physicallyCorrectLights = true;
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Load HDR environment map
  new THREE.RGBELoader().load(
    './christmas_photo_studio_04_1k.hdr',
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      pmremGenerator.dispose();
      texture.dispose();
    }
  );

  generateMaterial();

  mesh = new THREE.Mesh(new THREE.SphereGeometry(2, 512, 512), material);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  light = new THREE.PointLight(0xffffff, 1.5, 100);
  light.position.set(2.5, 2.5, 5);
  scene.add(light);

  light2 = new THREE.PointLight(0xffffff, 1.0, 100);
  light2.position.set(-2.5, -2.5, 0);
  scene.add(light2);

  backLight = new THREE.PointLight(0xffffff, 3.0, 100);
  backLight.position.set(0, 0, -7);
  scene.add(backLight);

  camera.lookAt(new THREE.Vector3(0, 0, 0));

  addControlPanel();
}

const animate = () => {
  requestAnimationFrame(animate);
  mesh.rotateY(0.002);
  controls.update();
  renderer.render(scene, camera);
}

const updateTextureRepeat = () => {
  console.log('Updating texture repeat:', textureRepeatX, textureRepeatY);
  
  const textures = [
    material.map,
    material.normalMap,
    material.roughnessMap,
    material.metalnessMap,
    material.aoMap,
    material.displacementMap
  ];

  textures.forEach(texture => {
    if (texture) {
      texture.repeat.set(textureRepeatX, textureRepeatY);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
    }
  });
  
  material.needsUpdate = true;
};

const addControlPanel = () => {
  console.log('Starting GUI setup...');

  gui = new dat.GUI({
    load: JSON.parse(localStorage.getItem(CONTROLS_STATE_KEY) || '{}')
  });

  console.log('GUI created');

  // Simplified save function
  const saveSettings = {
    save: function() {
      console.log('Save button clicked');  // Debug log
      
      // Create settings object
      const currentSettings = {
        material: {
          metalness: material.metalness,
          roughness: material.roughness,
          envMapIntensity: material.envMapIntensity,
          aoMapIntensity: material.aoMapIntensity,
          displacementScale: material.displacementScale,
          color: { r: material.color.r, g: material.color.g, b: material.color.b }
        },
        textures: {
          repeatX: textureRepeatX,
          repeatY: textureRepeatY
        },
        lights: {
          ambient: {
            intensity: ambientLight.intensity,
            visible: ambientLight.visible
          },
          point1: {
            intensity: light.intensity,
            distance: light.distance,
            position: {
              x: light.position.x,
              y: light.position.y,
              z: light.position.z
            },
            visible: light.visible
          },
          point2: {
            intensity: light2.intensity,
            distance: light2.distance,
            position: {
              x: light2.position.x,
              y: light2.position.y,
              z: light2.position.z
            },
            visible: light2.visible
          },
          back: {
            intensity: backLight.intensity,
            distance: backLight.distance,
            position: {
              x: backLight.position.x,
              y: backLight.position.y,
              z: backLight.position.z
            },
            visible: backLight.visible
          }
        },
        animation: {
          rotationSpeed: 0.002
        }
      };

      console.log('Settings object created:', currentSettings);  // Debug log

      try {
        const jsonString = JSON.stringify(currentSettings, null, 2);
        console.log('JSON string created:', jsonString);  // Debug log

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'settings.json';
        
        console.log('Triggering download...');  // Debug log
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Download complete');  // Debug log
      } catch (error) {
        console.error('Error in save process:', error);  // Error log
      }
    }
  };

  // Add Save Settings button at the start
  const saveButton = gui.add(saveSettings, 'save');
  saveButton.name('Save Settings');
  
  console.log('Save button added');

  // Make sure this button is remembered
  gui.remember(saveSettings);

  // Add tiling controls
  const tilingFolder = gui.addFolder('Texture Tiling');
  tilingFolder.add({ textureRepeatX: textureRepeatX }, 'textureRepeatX', 1, 20, 1)
    .name('Tiling X')
    .onChange((value) => {
      textureRepeatX = value;
      updateTextureRepeat();
    });
  tilingFolder.add({ textureRepeatY: textureRepeatY }, 'textureRepeatY', 1, 20, 1)
    .name('Tiling Y')
    .onChange((value) => {
      textureRepeatY = value;
      updateTextureRepeat();
    });
  tilingFolder.open();

  // Add rotation control
  const rotationFolder = gui.addFolder('Rotation');
  rotationFolder.add({ speed: 0.002 }, 'speed', 0, 0.01)
    .name('Speed')
    .onChange((value) => {
      rotationSpeed = value;
    });
  rotationFolder.open();

  // Save settings when controls change
  gui.remember({
    ambient: ambientLight,
    light1: light,
    light2: light2,
    backLight: backLight,
    material: material
  });

  // Ambient Light controls
  const ambientFolder = gui.addFolder('Ambient Light');
  ambientFolder.add(ambientLight, 'visible').name('On/Off');
  ambientFolder.add(ambientLight, 'intensity', 0, 2).name('Intensity');
  ambientFolder.open();

  // Extended Material controls
  const materialFolder = gui.addFolder('Material');
  materialFolder.add(material, 'roughness', 0, 2).name('Roughness');
  materialFolder.add(material, 'metalness', 0, 2).name('Metalness');
  materialFolder.add(material, 'envMapIntensity', 0, 2).name('Env Intensity');
  materialFolder.add(material, 'displacementScale', 0, 1).name('Displacement');
  // materialFolder.add(material, 'normalScale', 0, 2).name('Normal Strength');
  materialFolder.add(material, 'aoMapIntensity', 0, 2).name('AO Strength');
  materialFolder.addColor(material, 'color').name('Base Color');
  // materialFolder.add(material, 'wireframe');
  materialFolder.open();

  // Light 1 controls
  const light1Folder = gui.addFolder('Light 1');
  light1Folder.add(light, 'visible').name('On/Off');
  light1Folder.add(light, 'intensity', 0, 10).name('Intensity');
  light1Folder.add(light, 'distance', 0, 200).name('Distance');
  light1Folder.add(light, 'decay', 0, 5).name('Decay');
  light1Folder.add(light.position, 'x', -10, 10);
  light1Folder.add(light.position, 'y', -10, 10);
  light1Folder.add(light.position, 'z', -10, 10);
  light1Folder.open();

  // Light 2 controls
  const light2Folder = gui.addFolder('Light 2');
  light2Folder.add(light2, 'visible').name('On/Off');
  light2Folder.add(light2, 'intensity', 0, 10).name('Intensity');
  light2Folder.add(light2, 'distance', 0, 200).name('Distance');
  light2Folder.add(light2, 'decay', 0, 5).name('Decay');
  light2Folder.add(light2.position, 'x', -10, 10);
  light2Folder.add(light2.position, 'y', -10, 10);
  light2Folder.add(light2.position, 'z', -10, 10);
  light2Folder.open();

  // Back Light controls
  const backLightFolder = gui.addFolder('Back Light');
  backLightFolder.add(backLight, 'visible').name('On/Off');
  backLightFolder.add(backLight, 'intensity', 0, 10).name('Intensity');
  backLightFolder.add(backLight, 'distance', 0, 200).name('Distance');
  backLightFolder.add(backLight, 'decay', 0, 5).name('Decay');
  backLightFolder.add(backLight.position, 'x', -10, 10);
  backLightFolder.add(backLight.position, 'y', -10, 10);
  backLightFolder.add(backLight.position, 'z', -10, 10);
  backLightFolder.open();

  // Optional: Save state when window closes
  window.addEventListener('beforeunload', () => {
    localStorage.setItem(CONTROLS_STATE_KEY, JSON.stringify(gui.getSaveObject()));
  });
};

init();
console.log('Init complete');
animate();
