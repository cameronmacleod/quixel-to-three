/*
  Demo of PBR resources converted from Quixel to Three.js.
  
  https://github.com/mjurczyk/quixel-to-three
  
  Background texture from https://treasurechest.nl
*/
let clock, camera, scene, renderer, controls, loader, lights, mesh, material;

const generateMaterial = () => {
  const textureScale = 5.0;
  const roughness = loader.load('se2abbvc_4K_t3pbr.jpg', texture => {
    texture.encoding = THREE.LinearEncoding;
    texture.needsUpdate = true;
  });

  roughness.repeat.set(textureScale, textureScale);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;

  material = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 1.0,
    roughnessMap: roughness,
    roughness: 1.0
  });
};

const init = () => {
  clock = new THREE.Clock();
  
  loader = new THREE.TextureLoader();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, .01, 100);
  camera.position.set(0, 2.5, 5);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  scene = new THREE.Scene();
  scene.background = loader.load('//cdn.wtlstudio.com/common-ptr.wtlstudio.com/b137ccb0-c32c-4997-9548-7b090339583d.png', (texture) => {
    const generator = new THREE.PMREMGenerator(renderer);
    generator.compileEquirectangularShader();

    const textureMap = generator.fromCubemap(texture);
    generator.dispose();
    texture.dispose();
    
    textureMap.encoding = THREE.sRGBEncoding;
    textureMap.needsUpdate = true;
  
  	scene.environment = textureMap.texture;
  });

  generateMaterial();

  mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(2, 512, 512), material);
  mesh.position.set(0, 0, 0);

  scene.add(mesh);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4f9aff, 1));
  
  lights = [];

  for (let i = 0; i < 3; i++) {
  	const light = new THREE.PointLight(0xffffff, 1);
    lights.push(light);

  	scene.add(light);
  }

  camera.lookAt(new THREE.Vector3(0, 0, 0));
}

const animate = () => {
  requestAnimationFrame(animate);
  
  for (let i = 0; i < 3; i++) {
  	const light = lights[i];

		light.position.set(0, 0, 0);
  	light.rotateOnAxis(
      new THREE.Vector3(
        Number(i === 1 || i === 0),
        Number(i === 2),
        Number(i === 0)
       ),
      THREE.MathUtils.degToRad(.5)
    );
    const direction = new THREE.Vector3();
    light.getWorldDirection(direction);
    light.translateOnAxis(direction, 10);
  }
  
  mesh.rotateY(.01);
  
  controls.update();

  renderer.render(scene, camera);
}

init();
animate();
