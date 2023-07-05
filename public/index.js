import * as THREE from 'three'
import { OrbitControls } from './jsm/controls/OrbitControls.js'
import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import { MouseMeshInteraction } from "./three_mmi.js";
import { MouseMeshInteractionHandler } from "./three_mmi.js";

let scene, camera, renderer;
let geometry, normalMaterial, otherMaterial, cube;
let colour, intensity, light;
let ambientLight;
//keyboad array
let keyboard = [];
//gun stuff
let player = {
    height: 1.8,
    speed: 0.1,
    turnSpeed: Math.PI * 0.008,
    canShoot: 0
};

let orbit;
let modelLoaded, gunLoaded;

//mouse interaction using mmi.threejs
let mmi;

//3D models
let tv, arcade, gun, social;

//bullets array
let bullets = [];

let collidableMeshList = [];

//audio
let listener, arcadeSound, audioLoader, tvSound, atmos, music;

let clock, delta;

let sceneHeight, sceneWidth;
//grid
let size, divisions;

let startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
    //alert("We have initialised!");
    let overlay = document.getElementById("overlay");
    overlay.remove();
    let heading = document.getElementById("heading");
    heading.remove();

    sceneWidth = window.innerWidth;
    sceneHeight = window.innerHeight;

    modelLoaded = false;
    gunLoaded = false;

    //create our clock and set interval at 30 fpx
    clock = new THREE.Clock();

    //create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdfe9f3);

    //create fog https://www.youtube.com/watch?v=k1zGz55EqfU&ab_channel=SimonDev
    let fog = new THREE.FogExp2(0xdfe9f3, 0.009);
    //scene.fog = fog;

    //creating camera (fos,aspect,near,far)
    camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 10;
    camera.position.y = player.height;
    camera.lookAt(new THREE.Vector3(0, player.height, 0));

    //SKY
    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(10000, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0x8080ff,
            side: THREE.BackSide
        })
    );
    scene.add(sky);

    //TREES Simon Dev Channel https://www.youtube.com/watch?v=k1zGz55EqfU&ab_channel=SimonDev
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x80ff80 });
    const trunkGeo = new THREE.BoxGeometry(1, 1, 1);
    const leavesGeo = new THREE.ConeGeometry(1, 1, 10);
    for (let x = 0; x < 5; ++x) {
        for (let y = 0; y < 5; ++y) {
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            trunk.scale.set(2, (Math.random() + 1.0) * 5.0, 2);
            trunk.position.set(
                100.0 * (Math.random() * 2.0 - 1.0),
                trunk.scale.y / 2.0,
                100.0 * (Math.random() * 2.0 - 1.0)
            );
            leaves.scale.copy(trunk.scale);
            leaves.scale.set(10, trunk.scale.y * 2, 10);
            leaves.position.set(
                trunk.position.x,
                leaves.scale.y / 2 + (Math.random() + 1) * 2,
                trunk.position.z
            );
            scene.add(trunk);
            //scene.add(leaves);
        }
    }

    //skybox https://www.youtube.com/watch?v=PPwR7h5SnOE
    let skyboxLoader = new THREE.CubeTextureLoader();
    let skyboxTexture = skyboxLoader.load([
        "./assets/skybox/xpos.png",
        "./assets/skybox/xneg.png",
        "./assets/skybox/ypos.png",
        "./assets/skybox/yneg.png",
        "./assets/skybox/zpos.png",
        "./assets/skybox/zneg.png"
    ]);
    //scene.background = skyboxTexture;

    //plane (ground) https://www.youtube.com/watch?v=PPwR7h5SnOE
    let plane = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xc3ebcd })
    );
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    //WALLS
    let wall1 = new THREE.Mesh(
        new THREE.BoxGeometry(200, 50, 1),
        new THREE.MeshStandardMaterial({ color: "red" })
    );
    wall1.castShadow = false;
    wall1.receiveShadow = true;
    wall1.rotation.x = 0;
    wall1.position.set(0, 10, 100);
    scene.add(wall1);

    let wall2 = new THREE.Mesh(
        new THREE.BoxGeometry(200, 50, 1),
        new THREE.MeshStandardMaterial({ color: "green" })
    );
    wall2.castShadow = false;
    wall2.receiveShadow = true;
    wall2.rotation.x = 0;
    wall2.position.set(0, 10, -100);
    scene.add(wall2);

    let wall3 = new THREE.Mesh(
        new THREE.BoxGeometry(200, 50, 1),
        new THREE.MeshStandardMaterial({ color: "blue" })
    );
    wall3.castShadow = false;
    wall3.receiveShadow = true;
    wall3.rotation.y = Math.PI / 2;
    wall3.position.set(100, 10, 0);
    scene.add(wall3);

    let wall4 = new THREE.Mesh(
        new THREE.BoxGeometry(200, 50, 1),
        new THREE.MeshStandardMaterial({ color: "yellow" })
    );
    wall4.castShadow = false;
    wall4.receiveShadow = true;
    wall4.rotation.y = Math.PI / 2;
    wall4.position.set(-100, 10, 0);
    scene.add(wall4);

    //specify and adding renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //create orbit controls to interact with mouse
    //orbit = new OrbitControls(camera, renderer.domElement);
    //orbit.enableZoom = true;

    // lighting
    colour = 0xffffff;
    intensity = .001;
    light = new THREE.DirectionalLight(colour, intensity);
    light.position.set(100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    scene.add(light);
    ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
    scene.add(ambientLight);

    // create a box to spin
    geometry = new THREE.BoxGeometry(2, 2, 2);
    normalMaterial = new THREE.MeshNormalMaterial(); // Change this from normal to Phong in step 5
    otherMaterial = new THREE.MeshPhongMaterial({ color: 0x8a55e6 });
    cube = new THREE.Mesh(geometry, otherMaterial);
    cube.name = "cube";
    cube.position.set(0, 1, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;

    scene.add(cube);
    collidableMeshList.push(cube);

    listener = new THREE.AudioListener();
    camera.add(listener);

    // create a global audio source
    atmos = new THREE.Audio(listener);

    // load a sound and set it as the Audio object's buffer
    audioLoader = new THREE.AudioLoader();
    audioLoader.load(
        "./sounds/425367__soundholder__ambient-open-bunker-wind-blows-and-road-noises-stereo-ortf-8040.flac",
        function (buffer) {
            atmos.setBuffer(buffer);
            atmos.setLoop(true);
            atmos.setVolume(10);
            atmos.play();
        }
    );

    //SOUND (for single source and single listener)
    //arcade sound
    arcadeSound = new THREE.PositionalAudio(listener);
    audioLoader = new THREE.AudioLoader();
    audioLoader.load("./sounds/580898__bloodpixelhero__in-game.flac", function (
        buffer
    ) {
        arcadeSound.setBuffer(buffer);
        arcadeSound.setRefDistance(1); //a double value representing the reference distance for reducing volume as the audio source moves further from the listener – i.e. the distance at which the volume reduction starts taking effect. This value is used by all distance models.
        arcadeSound.setRolloffFactor(2);
        //arcadeSound.setDirectionalCone(180, 50, 0.1);
        arcadeSound.setLoop(true);
        arcadeSound.setVolume(2);
        arcadeSound.play();
    });

    //tv sound
    tvSound = new THREE.PositionalAudio(listener);
    audioLoader = new THREE.AudioLoader();
    audioLoader.load(
        "./sounds/214757__timbre__like-static-from-old-cheap-portable-analogue-television.flac",
        function (buffer) {
            tvSound.setBuffer(buffer);
            tvSound.setRolloffFactor(5);
            tvSound.setRefDistance(0.3); //a double value representing the reference distance for reducing volume as the audio source moves further from the listener – i.e. the distance at which the volume reduction starts taking effect. This value is used by all distance models.
            //tvSound.setDirectionalCone(180, 50, 0.1);
            tvSound.setLoop(true);
            tvSound.setVolume(8);
            tvSound.play();
        }
    );

    //resize window
    window.addEventListener("resize", onWindowResize, false);

    //strech goal: add gridHelper
    size = 20;
    divisions = 20;
    let gridHelper = new THREE.GridHelper(size, divisions);
    //scene.add(gridHelper);

    //loading models
    loadModels();
    mmi = new MouseMeshInteraction(scene, camera);
    mmi.addHandler("cube", "click", function (gltf) {
        console.log("cube has been clicked!");
        if (cube.material === normalMaterial) {
            cube.material = otherMaterial;
        } else if (cube.material === otherMaterial) {
            cube.material = normalMaterial;
        }
        if (arcadeSound.isPlaying) {
            arcadeSound.pause();
        } else {
            arcadeSound.play();

        }
    });
    play();
}

//stop animation
function stop() {
    renderer.setAnimationLoop(null);
}

// simple render function
function render() {
    var time = Date.now() * 0.0005;
    var delta = clock.getDelta();

    //updating bullets every frame
    for (let i = 0; i < 10; i++) {
        if (bullets[i] === undefined) continue;
        if (bullets[i].alive === false) {
            //if the bullets is dead, remove it and get the next one
            bullets.splice(i, 1);
            continue;
        }
        bullets[i].position.add(bullets[i].velocity); //integerating velocity
    }

    //keyboard movement
    //W key
    if (keyboard[87]) {
        camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
        camera.position.z -= Math.cos(camera.rotation.y) * player.speed;
    }
    //S key
    if (keyboard[83]) {
        camera.position.x += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += Math.cos(camera.rotation.y) * player.speed;
    }
    //A key
    if (keyboard[65]) {
        camera.position.x +=
            Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
        camera.position.z +=
            Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
    }
    //D key
    if (keyboard[68]) {
        camera.position.x +=
            Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
        camera.position.z +=
            Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
    }
    // Keyboard turn inputs

    //left E key
    if (keyboard[81]) {
        camera.rotation.y += player.turnSpeed;
    }
    //right Q key
    if (keyboard[69]) {
        camera.rotation.y -= player.turnSpeed;
    }
    //create bullets with spacebar
    if (keyboard[32] && player.canShoot <= 0) {
        let bullet = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        //bullet start from the player's position
        bullet.position.set(gun.position.x, gun.position.y+.05, gun.position.z+0.5);
        //velovity to move the bullet forward
        bullet.velocity = new THREE.Vector3(
            -Math.sin(camera.rotation.y),
            0,
            -Math.cos(camera.rotation.y)
        );
        bullet.castShadow = true;
        bullet.receiveShadow = true;
        //set timer to remove the bullets after 1s
        bullet.alive = true;
        setTimeout(function () {
            bullet.alive = false;
            scene.remove(bullet);
        }, 1000);

        //push to array NOTE: Doesn't work and couldn't fix it on time
        bullets.push(bullet);

        //adding bullet to the scene
        scene.add(bullet);
        // check for collisions

        player.canShoot = 100;
    }
    if (player.canShoot > 0) player.canShoot -= 1;

    //to make the gun move with the camera (player)
    if (gunLoaded) {
        //because if it tried to read the array empty it will crash
        gun.position.set(
            camera.position.x - Math.sin(camera.rotation.y - Math.PI / 15) * 0.9,
            camera.position.y -
            0.30 +
            Math.sin(time * 5 + camera.position.x + camera.position.z) * 0.005,
            camera.position.z - Math.cos(camera.rotation.y - Math.PI / 18) * 0.9
        );
        //   //for the gun to rotate witht the camera
        gun.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
    } else {
        console.log("gun is still loading :)");
    }

    renderer.render(scene, camera);
    //controls.update(clock.getDelta());
}

//start animation
function play() {
    //callback — The function will be called every available frame. If null is passed it will stop any already ongoing animation
    renderer.setAnimationLoop(() => {
        update();
        render();
    });
}

//our update function
function update() {
    //orbit.update();
    let time = Date.now() * 0.0005;
    delta += clock.getDelta();
    mmi.update();
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.04;
    cube.rotation.z -= 0.01;
}

function onWindowResize() {
    sceneHeight = window.innerHeight;
    sceneWidth = window.innerWidth;
    renderer.setSize(sceneWidth, sceneHeight);
    camera.aspect = sceneWidth / sceneHeight;
    // Always call updateProjectionMatrix on camera change
    camera.updateProjectionMatrix();
}

//3D models
function loadModels() {
    const loader = new GLTFLoader();

    //TV
    const TV = function (gltf, position) {
        // this callback handles loading a tv
        tv = gltf.scene.children[0];
        tv.scale.multiplyScalar(1 / 200);
        tv.position.copy(position);

        modelLoaded = true; // once our model has loaded, set our modelLoaded boolean flag to true
        scene.add(tv);
        tv.add(tvSound);
    };

    //----------------------------------------------------
    //ARCADE
    const ARCADE = function (gltf, position) {
        // this callback handles loading a ARCADE
        arcade = gltf.scene.children[0];
        arcade.scale.multiplyScalar(1 / 200);
        arcade.position.copy(position);        modelLoaded = true; // once our model has loaded, set our modelLoaded boolean flag to true
        scene.add(arcade);
        arcade.add(arcadeSound);
    };
    //----------------------------------------------------
    //GUN
    const GUN = function (gltf, position) {
        // this callback handles loading a gun
        gun = gltf.scene.children[0];
        gun.scale.multiplyScalar(0.0003);
        //gun.rotation.y = Math.PI / 2;

        gun.position.copy(position);

        gunLoaded = true; // once our model has loaded, set our modelLoaded boolean flag to true
        scene.add(gun);
    };
    //----------------------------------------------------
    //social
    const SOCIALS = function (gltf, position) {
        // this callback handles loading a gun
        social = gltf.scene.children[0];
        social.scale.multiplyScalar(0.4);

        social.position.copy(position);

        modelLoaded = true; // once our model has loaded, set our modelLoaded boolean flag to true
        scene.add(social);
    };
    //the loader will report the loading status to this function
    const onProgress = function () {
        console.log("progress");
    };
    //----------------------------------------------------

    // the loader will send any error messages to this function
    const onError = function (errorMessage) {
        console.log(errorMessage);
    };

    //----------------------------------------------------
    //inital positions for the models
    const tvPos = new THREE.Vector3(20, 0, 0);

    //laod the GLTF file with all required callback functions
    loader.load(
        "./models/black_and_white_belweder__ot_1782_tv_set.glb", //file path
        function (gltf) {
            //specify the callback unction to call the tv once it's loaded
            TV(gltf, tvPos);
        },
        onProgress, //specify progress callback
        onError //specify error callback
    );
    //----------------------------------------------------
    //inital positions for the models
    const arcadePos = new THREE.Vector3(-10, 0, 0);

    //laod the GLTF file with all required callback functions
    loader.load(
        "./models/arcade_game_machine_001.glb", //file path
        function (gltf) {
            //specify the callback unction to call the ARCADE once it's loaded
            ARCADE(gltf, arcadePos);
        },
        onProgress, //specify progress callback
        onError //specify error callback
    );
    //----------------------------------------------------
    //inital positions for the models
    const gunPos = new THREE.Vector3(0, 3, 0);

    //laod the GLTF file with all required callback functions
    loader.load(
        "./models/Sketchfab_Scene.glb", //file path
        function (gltf) {
            //specify the callback unction to call the gun once it's loaded
            GUN(gltf, gunPos);
        },
        onProgress, //specify progress callback
        onError //specify error callback
    );
    //----------------------------------------------------
    //inital positions for the models
    const socialPos = new THREE.Vector3(15, 0, 10);

    //laod the GLTF file with all required callback functions
    loader.load(
        "models/social_media_hologram.glb", //file path
        function (gltf) {
            //specify the callback unction to call the gun once it's loaded
            SOCIALS(gltf, socialPos);
        },
        onProgress, //specify progress callback
        onError //specify error callback
    );
}

//to know when a key is pressed
function keyDown(event) {
    keyboard[event.keyCode] = true;
}
//to know when a key is relesed
function keyUp(event) {
    keyboard[event.keyCode] = false;
}
window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);
