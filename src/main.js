import { ACESFilmicToneMapping, BufferAttribute, BufferGeometry, EquirectangularReflectionMapping, Mesh, MeshNormalMaterial, PerspectiveCamera, PolyhedronGeometry, Scene, WebGLRenderer, sRGBEncoding } from "three";

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";

let camera, scene, renderer, clock, mixer, analyser, dataArray;
var bones = [];
let squid = null;

const quaternion = new THREE.Quaternion();

var audio = document.getElementById("audio");

function play(e) {
    console.log(e);
    audio.src = e; // URL.createObjectURL(e);
    audio.load();
    //audio.play();

    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

init();
animate();

function init() {
    const container = document.querySelector("#app");
    document.body.appendChild(container);

    play("/assets/audio/lucky.mp3");

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
                squid = gltf.scene;

                scene.add(squid);
                console.log(scene);

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

function tentaculeAnim() {
    let t = clock.getElapsedTime();

    bones.forEach(bone => {
        bone.forEach((b, i) => {
            b.position.z += move(t, i)
        })
    })
}

function max(arr) {
    return arr.reduce(function (a, b) { return Math.max(a, b); })
}

function avg(arr) {
    var total = arr.reduce(function (sum, b) { return sum + b; });
    return (total / arr.length);
}

function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    //var lowerHalfArray = dataArray.slice(0, (dataArray.length / 2) - 1);
    //var upperHalfArray = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);

    tentaculeAnim();

    let h = avg(dataArray);
    analyser.getByteFrequencyData(dataArray);

    if (squid) {
        scene.children[0].children[0].material.color.setHSL(h/255, 1, 0.5);
        quaternion.setFromAxisAngle(new THREE.Vector3(h/10, h/10, h/10), h/255 * 0.01);
        squid.applyQuaternion(quaternion);
        //squid.translateX(h/255);
    }

    renderer.render(scene, camera);
}