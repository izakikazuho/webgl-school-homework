// = 001 ======================================================================
// three.js サンプルの雛形です。
// これは基本となる雛形サンプルなので他のサンプルよりもコメント多めになってます。
// ============================================================================

// - JavaScript にあまり詳しくない方向けの解説 --------------------------------
// JavaScript がブラウザ上で動作するとき、変数などのスコープのうち、最も広い範囲
// で有効となるグローバルスコープは「ウィンドウの名前空間」です。ちょっと別の言
// い方をすると、関数内部などではない場所（たとえばファイルの冒頭など）で唐突に
// var variable = null; のように書くと window.variable = null; と同義になります。
// ただし、ちょっとややこしいのですが JavaScript のファイルが module として読み
// 込まれている場合は振る舞いが変化し、ファイルの冒頭などで変数を宣言・定義して
// いても、そのスコープはモジュールレベルに閉じるようになります。
//
// また、変数のスコープの話で言うと JavaScript では関数のような {} を使って記述
// する構文でブロック構造を作ると、そのブロック内で変数のスコープが閉じられます。
// if 文や、for 文などでも同様です。これらのことを踏まえてスクールのサンプルは原
// 則として以下のようなルールで記述しています。
//
// 1. モジュール形式で記述する
// 2. 可能な限り変数の宣言には const を使う（再代入できない変数の宣言）
// 3. 大文字のみで構成される変数・プロパティは定数的に利用する
// ----------------------------------------------------------------------------

// 必要なモジュールを読み込み
import * as THREE from "../lib/three.module.js";

// DOM がパースされたことを検出するイベントを設定
window.addEventListener(
  "DOMContentLoaded",
  () => {
    // HTML 上に定義されている親要素用への参照を取得
    const wrapper = document.querySelector("#webgl");
    // 制御クラスのインスタンスを生成
    const app = new ThreeApp(wrapper);
    // 描画
    app.render();
  },
  false
);

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class ThreeApp {
  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    fovy: 100,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 15.0,
    position: new THREE.Vector3(0, 1, 0),
    // カメラの注視点
    lookAt: new THREE.Vector3(0, 0, 0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x666666, // 画面をクリアする色
    width: window.innerWidth, // レンダラーに設定する幅
    height: window.innerHeight, // レンダラーに設定する高さ
  };
  /**
   * マテリアル定義のための定数
   */
  static MATERIAL_PARAM = {
    color: 0x3399ff, // マテリアルの基本色
  };
  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff, // 光の色
    intensity: 1.0, // 光の強度
    position: new THREE.Vector3(1.0, 1.0, 1.0), // 光の向き
  };
  /**
   * アンビエントライト定義のための定数
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff, // 光の色
    intensity: 0.1, // 光の強度
  };

  renderer; // レンダラ
  scene; // シーン
  camera; // カメラ
  geometry; // ジオメトリ
  material; // マテリアル
  box; // ボックスメッシュ
  directionalLight; //　ディレクショナルライト
  ambientLight; // アンビエントライト
  pointLight; // ポイントライト

  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    // - レンダラの初期化 -----------------------------------------------------
    // レンダラ、という言葉はフロントエンドではあまり見聞きしない言葉です。わか
    // りやすく言うなら、レンダラとは「現像する人」です。カメラが撮影したフィル
    // ムを、現像してスクリーンに映してくれる役割を担います。
    // ------------------------------------------------------------------------
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(
      ThreeApp.RENDERER_PARAM.width,
      ThreeApp.RENDERER_PARAM.height
    );
    this.renderer.shadowMap.enabled = true;
    wrapper.appendChild(this.renderer.domElement);

    // - シーンの初期化 -------------------------------------------------------
    // Scene とは、その名のとおり 3D シーンを管理するためのものです。
    // たとえばこのシーンにはどんなオブジェクトを使うのか、あるいはどんなカメラ
    // を使って撮影を行うのかなど、描画する 3D 空間全体の情報をまとめて持ってい
    // るのが Scene オブジェクトです。
    // 3D の専門用語では、いわゆるシーングラフ（Scene Graph）と呼ばれているもの
    // で、three.js ではこれを Scene オブジェクトによって実現します。
    // ------------------------------------------------------------------------
    this.scene = new THREE.Scene();

    // - カメラの初期化 -------------------------------------------------------
    // three.js におけるカメラは、現実世界のカメラと同じように空間を撮影するため
    // に使います。
    // 現実のカメラがそうであるように、カメラの性能や、あるいは性質によって最終
    // 的に描かれる世界はまったく違ったものになります。
    // ------------------------------------------------------------------------
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    this.pointLight = new THREE.PointLight(0x779999, 10, 0, 2.5);
    this.pointLight.castShadow = true;
    this.pointLight.position.set(0, 0, 0);
    this.scene.add(this.pointLight);
    // const pointLightHelper = new THREE.PointLightHelper(this.pointLight, 1);
    // this.scene.add(pointLightHelper);

    this.roomGeometry = new THREE.BoxGeometry(6, 6, 6);
    this.roomMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      // wireframe: true,
      side: THREE.BackSide,
    });

    this.room = new THREE.Mesh(this.roomGeometry, this.roomMaterial);
    this.room.receiveShadow = true;
    this.scene.add(this.room);

    // - ジオメトリとマテリアルの初期化 ---------------------------------------
    // ジオメトリとは、3D シーン上にオブジェクトを描くために使う「頂点」の集合体
    // です。もっと言うと、ジオメトリとは「単なる形状を定義したもの」であり、言
    // うなれば設計図、あるいは骨組みのようなものです。
    // ジオメトリはあくまでも設計図にすぎないので、これをどのように 3D 空間に配
    // 置するのかや、どのような色を塗るのかは、別の概念によって決まります。
    // three.js では、どのような色を塗るのかなど質感に関する設定はマテリアルとい
    // うオブジェクトがそれを保持するようになっています。
    // ------------------------------------------------------------------------
    this.geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    this.material = new THREE.MeshPhysicalMaterial({
      // wireframe: true,
      color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide,
      transmission: 0.93, //透過率
      roughness: 0.1, //粗さ
    });

    // - メッシュの初期化 -----------------------------------------------------
    // three.js では、ジオメトリとマテリアルを別々に生成し組み合わせることで 3D
    // 空間に配置することができるメッシュを定義できます。
    // 定義したメッシュは、シーンに追加することではじめて描画の対象になります。
    // ------------------------------------------------------------------------
    this.boxes = [];
    for (let i = 0; i < 100; i++) {
      this.boxes.push(new MyBoxMesh(this.geometry, this.material, i));
      this.scene.add(this.boxes[i].box);
    }
    // this.helper = new THREE.AxesHelper(4);
    // this.scene.add(this.helper);
  }

  /**
   * 描画処理
   */
  render() {
    // - 描画フェーズ ---------------------------------------------------------
    // シーンに必要なオブジェクトを追加できたら、いよいよ描画です。
    // 描画を行うためには対象のシーンをレンダラでスクリーンに描画します。このと
    // き、どのカメラで描画するかを同時に指定します。
    // ------------------------------------------------------------------------
    this.renderer.render(this.scene, this.camera);
  }
}

class MyBoxMesh {
  constructor(geometry, material, i) {
    this.radian = (i * Math.PI) / 50;
    this.box = new THREE.Mesh(geometry, material);
    this.box.castShadow = true;
    this.box.receiveShadow = true;
    this.box.position.set(
      // Math.cos(this.radian) * 1,
      // (Math.random() - 0.5) * 1,
      // // // (Math.random() - 0.5) * 0.5,
      // Math.sin(this.radian) * 1,
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
  }
}
