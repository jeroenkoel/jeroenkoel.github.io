export const intention01 = {
  id: "intention-01",
  animation: "/assets/levels/intention-01/animation.mp4",
  keyframes: [1, 2, 3].map(i => `/assets/levels/intention-01/keyframe-${i}.png`),
  answers: [
    {
      id: "hang-painting",
      image: "/assets/levels/intention-01/answer-1.png",
      altKey: "answer.hanging",
      correct: true
    },
    {
      id: "sweep-floor",
      image: "/assets/levels/intention-01/answer-2.png",
      altKey: "answer.sweeping",
      correct: false
    },
    {
      id: "sit-on-chair",
      image: "/assets/levels/intention-01/answer-3.png",
      altKey: "answer.sitting",
      correct: false
    }
  ]
};
