import Phaser from "phaser";
import { phaserGeneratedAssets } from "../../data/asset-manifest.generated";
import { phaserImage2Assets } from "../../data/image2Assets";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("room", "assets/scenes/room.png");
    this.load.image("aura", "assets/props/aura.png");
    this.load.image("water", "assets/resources/water.png");
    this.load.image("medkit", "assets/props/medkit.png");
    this.load.image("radio", "assets/props/radio.png");
    this.load.image("map", "assets/props/map.png");
    this.load.image("mask", "assets/props/mask.png");
    this.load.image("battery", "assets/props/battery.png");
    this.load.image("maDehai", "assets/characters/ma_dehai.png");
    this.load.image("shenZhiyue", "assets/characters/shen_zhiyue.png");
    this.load.image("xiaoTie", "assets/characters/xiao_tie.png");
    this.load.image("laoQian", "assets/characters/lao_qian.png");

    phaserGeneratedAssets.forEach((asset) => {
      this.load.svg(asset.key, asset.path);
    });
    phaserImage2Assets.forEach((asset) => {
      this.load.image(asset.key, asset.path);
    });
  }

  create() {
    this.scene.start("ShelterScene");
  }
}
