import { ACESFilmicToneMapping, BufferAttribute, BufferGeometry, EquirectangularReflectionMapping, Mesh, MeshNormalMaterial, PerspectiveCamera, PolyhedronGeometry, Scene, WebGLRenderer, sRGBEncoding } from "three";

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";

let camera, scene, renderer, clock, mixer;
let pickedObject, pickedObjectSavedColor, raycaster;
var bones = [];

var data = [];

init();
animate();

function init() {
    const container = document.querySelector("#app");
    document.body.appendChild(container);

    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.25, 200);
    camera.position.set(40, 10, 0);

    scene = new Scene();
    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();

    new THREE.TextureLoader()
        .setPath('/assets/background/')
        .load('manga_testing_one_piece.jpg', (texture) => {

            texture.mapping = EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;


            const loader = new GLTFLoader().setPath("/assets/models/");
            loader.load("pieuvre_donovan_brun_v2.glb", function (gltf) {
                const squid = gltf.scene;

                //scene.add(squid);
                //const squidBox = new THREE.BoxHelper(squid, 0xffffff);
                //scene.add(squidBox);

                var geometry = new THREE.BoxGeometry(40, 1, 40); //x,y,z
                var boxMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                var cube = new THREE.Mesh(geometry, boxMaterial);

                cube.position.set(0, 0, 0);
                cube.geometry.computeBoundingBox(); // null sinon
                const boxMap = new THREE.BoxHelper(cube, 0xffffff);
                scene.add(boxMap);
                //scene.add(cube);


                for (let index = 0; index < 20; index++) {
                    const c = addCube(Math.random() * 38 - 19, 0, Math.random() * 38 - 19);

                    data.push({
                        cube: c,
                        speed: Math.random() * 0.1 + 0.1,
                        sensx: Math.random() + 0.5,
                        sensz: Math.random(),
                    })

                    c.geometry.computeBoundingBox();
                    //const b = new THREE.BoxHelper(c, 0xffffff);
                    //scene.add(b);
                }

                /*
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
                */

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
    controls.minDistance = 0;
    controls.maxDistance = 100;
    controls.target.set(0, 0, - 0.2);
    controls.update();

    window.addEventListener("contextmenu", setPickPosition);
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
        bone.forEach((b, i) => {
            b.position.z += move(t, i)
        })
    })

    data.forEach((d, i) => {
        if (d.cube.position.x > 20) {
            d.sensx = d.sensx * -1;
        }
        if (d.cube.position.x < -20) {
            d.sensx = d.sensx * -1;
        }
        if (d.cube.position.z > 20) {
            d.sensz = d.sensz * -1;
        }
        if (d.cube.position.z < -20) {
            d.sensz = d.sensz * -1;
        }

        d.cube.position.x += d.speed * d.sensx;
        d.cube.position.z += d.speed * d.sensz;

        data.forEach((d2, j) => {
            let distance = d.cube.position.distanceTo(d2.cube.position);
            let angle = d.cube.position.angleTo(d2.cube.position);
            if (distance <= 2 && i != j) {
                d2.sensx = d2.sensx * -1;
                d2.sensz = d2.sensz * -1;
                d.sensx = d.sensx * -1;
                d.sensz = d.sensz * -1;
            }
        });
    })

    renderer.render(scene, camera);
}

function addCube(px, py, pz) {
    var colorandom = new THREE.Color(0xffffff);
    colorandom.setHex(Math.random() * 0xffffff);
    var geometry = new THREE.SphereGeometry(1); //x,y,z
    var boxMaterial = new THREE.MeshBasicMaterial({ color: colorandom });
    var cube = new THREE.Mesh(geometry, boxMaterial);

    cube.position.set(px, py, pz);
    cube.geometry.computeBoundingBox(); // null sinon
    scene.add(cube);
    return cube;
}

function setPickPosition(event) {
    const pos = { x: 0, y: 0 };
    pos.x = (event.clientX / window.innerWidth) * 2 - 1;
    pos.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // cast a ray through the frustum
    raycaster.setFromCamera(pos, camera);

    const intersectedObjects = raycaster.intersectObjects(scene.children);

    if (intersectedObjects.length) {
        const pickedObject = intersectedObjects[0].object;
        pickedObject.material.color.r = 1
        pickedObject.material.color.g = 0
        pickedObject.material.color.b = 0
    }

    //scene.add(new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff0000) );
}