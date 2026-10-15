const paintingAssets = {
    animation: "/assets/levels/intention-04/intention-04-animation.mp4",
    keyframes: [
        "/assets/levels/intention-04/intention-04-keyframe-1.png",
        "/assets/levels/intention-04/intention-04-keyframe-2.png",
        "/assets/levels/intention-04/intention-04-keyframe-3.png"
    ],
    answers: [
        { id: "sit-on-chair", image: "/assets/levels/intention-04/intention-04-answer-1.png", animation: "/assets/levels/intention-04/intention-04-answer-1.mp4", altKey: "answer.sitting", correct: false },
        { id: "hang-painting", image: "/assets/levels/intention-04/intention-04-answer-2.png", animation: "/assets/levels/intention-04/intention-04-answer-2.mp4", altKey: "answer.hanging", correct: true },
        { id: "sweep-floor", image: "/assets/levels/intention-04/intention-04-answer-3.png", animation: "/assets/levels/intention-04/intention-04-answer-3.mp4", altKey: "answer.sweeping", correct: false }
    ]
};

export const tutorialLevel = { id: "tutorial", ...paintingAssets };

export const normalLevels = [
    { id: "intention-01", ...paintingAssets },
    { id: "intention-02", ...paintingAssets },
    { id: "intention-03", ...paintingAssets },
    { id: "intention-04", ...paintingAssets },
    { id: "intention-05", ...paintingAssets },
    { id: "intention-06", ...paintingAssets },
    { id: "emotion-01", ...paintingAssets },
    { id: "emotion-02", ...paintingAssets },
    { id: "emotion-03", ...paintingAssets },
    { id: "emotion-04", ...paintingAssets },
    { id: "emotion-05", ...paintingAssets },
    { id: "emotion-06", ...paintingAssets },
    { id: "causal-01", ...paintingAssets },
    { id: "causal-02", ...paintingAssets },
    { id: "causal-03", ...paintingAssets },
    { id: "causal-04", ...paintingAssets },
    { id: "causal-05", ...paintingAssets },
    { id: "causal-06", ...paintingAssets }
];
