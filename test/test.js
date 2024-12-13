/*
  Demo of PBR resources converted from Quixel to Three.js.
  
  https://github.com/mjurczyk/quixel-to-three
  
  Background texture from https://treasurechest.nl
*/
let clock, camera, scene, renderer, controls, loader, exrLoader, lights, mesh, material;

const assetSample = 'se4pcf0c/se4pcf0c_4K';

const generateMaterial = () => {
  console.log('Attempting to load textures from:', assetSample);
  
  // Create a simple metallic material first
  material = new THREE.MeshStandardMaterial({
    color: 0x888888,      // Medium gray
    metalness: 1.0,       // Fully metallic
    roughness: 0.2,       // Fairly smooth
    envMapIntensity: 1.0  // Standard reflection intensity
  });

  console.log('Loading textures from these paths:');
  console.log(`Albedo: ${assetSample}_Albedo.jpg`);
  console.log(`Normal: ${assetSample}_Normal.jpg`);
  console.log(`Metalness: ${assetSample}_Metalness.jpg`);
  console.log(`Roughness: ${assetSample}_Roughness.jpg`);
  console.log(`Displacement: ${assetSample}_Displacement.exr`);

  // Load textures with error handling
  loader.load(
    `${assetSample}_Albedo.jpg`,
    (texture) => {
      console.log('✓ Albedo loaded');
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    (error) => console.error('✗ Albedo error:', error)
  );

  loader.load(
    `${assetSample}_Normal.jpg`,
    (texture) => {
      console.log('✓ Normal loaded');
      material.normalMap = texture;
      material.needsUpdate = true;
    },
    undefined,
    (error) => console.error('✗ Normal error:', error)
  );

  console.log('Basic material created');
  
  // Log the actual material properties
  console.log('Material properties:', {
    color: material.color,
    metalness: material.metalness,
    roughness: material.roughness
  });

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
    './brown_photostudio_02_1k.hdr',  // Use explicit relative path
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      
      pmremGenerator.dispose();
      texture.dispose();
    },
    undefined,
    (error) => {
      console.error('Error loading environment map:', error);
    }
  );

  // Load the displacement map and set it on the material
  exrLoader.load(
    `${assetSample}_Displacement.exr`,
    (texture) => {
      console.log('✓ Displacement EXR loaded');
      material.displacementMap = texture;
      material.displacementScale = 0.1; // Adjust the scale as needed
      material.needsUpdate = true;
    },
    undefined,
    (error) => {
      console.error('✗ Displacement EXR error:', error);
    }
  );

  generateMaterial();

  mesh = new THREE.Mesh(new THREE.SphereGeometry(2, 512, 512), material);
  mesh.position.set(0, 0, 0);

  scene.add(mesh);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const light = new THREE.PointLight(0xffffff, 1.5, 100);
  light.position.set(2.5, 2.5, 5);
  scene.add(light);

  const light2 = new THREE.PointLight(0xffffff, 1.0, 100);
  light2.position.set(-2.5, -2.5, -5);
  scene.add(light2);

  camera.lookAt(new THREE.Vector3(0, 0, 0));
}

const animate = () => {
  requestAnimationFrame(animate);
  mesh.rotateY(0.002);
  controls.update();
  renderer.render(scene, camera);
}

init();
animate();
