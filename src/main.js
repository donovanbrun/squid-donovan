import { ACESFilmicToneMapping, BufferAttribute, BufferGeometry, EquirectangularReflectionMapping, Mesh, MeshNormalMaterial, PerspectiveCamera, PolyhedronGeometry, Scene, WebGLRenderer, sRGBEncoding } from "three";

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";

let camera, scene, renderer, clock, mixer;
var bones = [];

init();
animate();

function init() {
    const container = document.querySelector("#app");
    document.body.appendChild(container);

    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.25, 200);
    camera.position.set(40, 10, 0);

    scene = new Scene();
    clock = new THREE.Clock();

    new THREE.TextureLoader()
        .setPath('/assets/background/')
        .load('manga_testing_one_piece.jpg', (texture) => {

            texture.mapping = EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;

            const loader = new GLTFLoader().setPath("/assets/models/");
            loader.load("pieuvre_donovan_brun_v2.glb", function (gltf) {
                const cube = gltf.scene;

                scene.add(cube);
                //console.log(scene)

                for (let index = 0; index < 8; index++) {
                    if (index == 0) var object = scene.getObjectByName("Bone");
                    else var object = scene.getObjectByName("Bone_" + index);

                    let tmp = []
                    tmp.push(object)
                    object = object.children;

                    while (!(object === undefined || object.length == 0)) {
                        tmp.push(object[0]);
                        object = object[0].children;
                    }

                    bones.push(tmp)
                }

                //console.log(bones)

                mixer = new THREE.AnimationMixer(gltf.scene);
                gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play();
                });
            });
        });

    // renderer
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = sRGBEncoding;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    //controls.addEventListener('change', render); // use if there is no animation loop
    controls.minDistance = 10;
    controls.maxDistance = 100;
    controls.target.set(0, 0, - 0.2);
    controls.update();

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function move(x, boneIndex) {
    const amplitude = .007;
    const period = 2;
    const phaseOffset = Math.PI / bones[0].length * 2;
    const phase = boneIndex * phaseOffset;

    return amplitude * Math.sin(2 * Math.PI * (x / period) + phase);
}

function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    let t = clock.getElapsedTime();
    bones.forEach(bone => {
        bone.forEach((b,i) => {
            b.position.z += move(t,i)
        })
    })

    renderer.render(scene, camera);
}