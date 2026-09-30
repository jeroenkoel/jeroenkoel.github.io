export const intention01 = {
  id: "intention-01",
  scene: {width: 1672, height: 941, background: "/assets/levels/intention-01/background.png"},
  animation: "/assets/levels/intention-01/animation.mp4",
  keyframes: [1, 2, 3].map(i => `/assets/levels/intention-01/keyframe-${i}.png`),
  elements: {
    womanBroom: {label: "Vrouw", states: {
      hanging: {images: [
        {src: "/assets/levels/intention-01/woman-hanging.png", x: 785, y: 12, width: 242, zIndex: 30},
        {src: "/assets/levels/intention-01/broom-leaning.png", x: 1445, y: 475, width: 105, zIndex: 18}
      ]},
      sweeping: {images: [{src: "/assets/levels/intention-01/woman-sweeping.png", x: 740, y: 315, width: 410, zIndex: 30}]},
      sitting: {images: [
        {src: "/assets/levels/intention-01/woman-sitting.png", x: 1145, y: 380, width: 230, zIndex: 30},
        {src: "/assets/levels/intention-01/broom-leaning.png", x: 1445, y: 475, width: 105, zIndex: 18}
      ]}
    }},
    chair: {label: "Stoel", states: {
      table: {images: [{src: "/assets/levels/intention-01/chair.png", x: 1168, y: 555, width: 250, zIndex: 20}]},
      wall: {images: [{src: "/assets/levels/intention-01/chair.png", x: 770, y: 557, width: 240, zIndex: 20}]}
    }},
    painting: {label: "Schilderij", states: {
      ground: {images: [{src: "/assets/levels/intention-01/painting-ground.png", x: 544, y: 658, width: 200, zIndex: 12}]},
      wall: {images: [{src: "/assets/levels/intention-01/painting-wall.png", x: 832, y: 40, width: 191, zIndex: 24}]}
    }}
  }
};
