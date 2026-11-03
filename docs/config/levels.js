
export const tutorialLevel = {
    id: "tutorial",
    animation: "/assets/levels/tutorial/tutorial-animation.mp4",
    keyframes: [
        "/assets/levels/tutorial/tutorial-keyframe-1.png",
        "/assets/levels/tutorial/tutorial-keyframe-2.png",
        "/assets/levels/tutorial/tutorial-keyframe-3.png"
    ],
    answers: [
        { id: "ball-in-triangle", image: "/assets/levels/tutorial/tutorial-answer-1.png", altKey: "tutorial.ontop", correct: false },
        { id: "balls-scattered", image: "/assets/levels/tutorial/tutorial-answer-2.png", altKey: "tutorial.scattered", correct: true },
        { id: "ball-past-triangle", image: "/assets/levels/tutorial/tutorial-answer-3.png", altKey: "tutorial.past", correct: false }
    ]
};

export const normalLevels = [
    {
        id: "intention-01",
        animation: "/assets/levels/intention-01/intention-01-animation.mp4",
        keyframes: [
            "/assets/levels/intention-01/intention-01-keyframe-1.png",
            "/assets/levels/intention-01/intention-01-keyframe-2.png",
            "/assets/levels/intention-01/intention-01-keyframe-3.png"
        ],
        answers: [
            { id: "put-newspaper-back", image: "/assets/levels/intention-01/intention-01-answer-1.png", altKey: "answer.flyPutBack", correct: false },
            { id: "read-newspaper", image: "/assets/levels/intention-01/intention-01-answer-2.png", altKey: "answer.flyRead", correct: false },
            { id: "swat-fly", image: "/assets/levels/intention-01/intention-01-answer-3.png", altKey: "answer.flySwat", correct: true }
        ]
    },
    {
        id: "intention-02",
        animation: "/assets/levels/intention-02/intention-02-animation.mp4",
        keyframes: [
            "/assets/levels/intention-02/intention-02-keyframe-1.png",
            "/assets/levels/intention-02/intention-02-keyframe-2.png",
            "/assets/levels/intention-02/intention-02-keyframe-3.png"
        ],
        answers: [
            { id: "sit-by-river", image: "/assets/levels/intention-02/intention-02-answer-1.png", altKey: "answer.riverSit", correct: false },
            { id: "cross-on-log", image: "/assets/levels/intention-02/intention-02-answer-2.png", altKey: "answer.riverCross", correct: true },
            { id: "turn-back", image: "/assets/levels/intention-02/intention-02-answer-3.png", altKey: "answer.riverReturn", correct: false }
        ]
    },
    {
        id: "intention-03",
        animation: "/assets/levels/intention-03/intention-03-animation.mp4",
        keyframes: [
            "/assets/levels/intention-03/intention-03-keyframe-1.png",
            "/assets/levels/intention-03/intention-03-keyframe-2.png",
            "/assets/levels/intention-03/intention-03-keyframe-3.png"
        ],
        answers: [
            { id: "enter-pink-shop", image: "/assets/levels/intention-03/intention-03-answer-1.png", altKey: "answer.shopPink", correct: false },
            { id: "enter-kite-shop", image: "/assets/levels/intention-03/intention-03-answer-2.png", altKey: "answer.shopKite", correct: true },
            { id: "walk-away", image: "/assets/levels/intention-03/intention-03-answer-3.png", altKey: "answer.shopLeave", correct: false }
        ]
    },
    {
        id: "intention-04",
        animation: "/assets/levels/intention-04/intention-04-animation.mp4",
        keyframes: [
            "/assets/levels/intention-04/intention-04-keyframe-1.png",
            "/assets/levels/intention-04/intention-04-keyframe-2.png",
            "/assets/levels/intention-04/intention-04-keyframe-3.png"
        ],
        answers: [
            { id: "hang-painting", image: "/assets/levels/intention-04/intention-04-answer-1.png", altKey: "answer.hanging", correct: true },
            { id: "sit-on-chair", image: "/assets/levels/intention-04/intention-04-answer-2.png", altKey: "answer.sitting", correct: false },
            { id: "sweep-floor", image: "/assets/levels/intention-04/intention-04-answer-3.png", altKey: "answer.sweeping", correct: false }
        ]
    },
    {
        id: "intention-05",
        animation: "/assets/levels/intention-05/intention-05-animation.mp4",
        keyframes: [
            "/assets/levels/intention-05/intention-05-keyframe-1.png",
            "/assets/levels/intention-05/intention-05-keyframe-2.png",
            "/assets/levels/intention-05/intention-05-keyframe-3.png"
        ],
        answers: [
            { id: "tie-sheets", image: "/assets/levels/intention-05/intention-05-answer-1.png", altKey: "answer.prisonRope", correct: true },
            { id: "call-for-help", image: "/assets/levels/intention-05/intention-05-answer-2.png", altKey: "answer.prisonCall", correct: false },
            { id: "sleep-in-bed", image: "/assets/levels/intention-05/intention-05-answer-3.png", altKey: "answer.prisonSleep", correct: false }
        ]
    },
    {
        id: "intention-06",
        animation: "/assets/levels/intention-06/intention-06-animation.mp4",
        keyframes: [
            "/assets/levels/intention-06/intention-06-keyframe-1.png",
            "/assets/levels/intention-06/intention-06-keyframe-2.png",
            "/assets/levels/intention-06/intention-06-keyframe-3.png"
        ],
        answers: [
            { id: "leave-door", image: "/assets/levels/intention-06/intention-06-answer-1.png", altKey: "answer.doorLeave", correct: false },
            { id: "reach-door-handle", image: "/assets/levels/intention-06/intention-06-answer-2.png", altKey: "answer.doorReach", correct: true },
            { id: "open-umbrella", image: "/assets/levels/intention-06/intention-06-answer-3.png", altKey: "answer.doorUmbrella", correct: false }
        ]
    },
    // Until new assets are supplied, levels 7–18 use the painting scene as a placeholder.
    {
        id: "causal-01",
        animation: "/assets/levels/causal-01/causal-01-animation.mp4",
        keyframes: [
            "/assets/levels/causal-01/causal-01-keyframe-1.png",
            "/assets/levels/causal-01/causal-01-keyframe-2.png",
            "/assets/levels/causal-01/causal-01-keyframe-3.png"
        ],
        answers: [
            { id: "puddle-wet", image: "/assets/levels/causal-01/causal-01-answer-1.png", altKey: "answer.puddleWet", correct: true },
            { id: "car-splash-dry", image: "/assets/levels/causal-01/causal-01-answer-2.png", altKey: "answer.puddleDry", correct: false },
            { id: "puddle-car-coming", image: "/assets/levels/causal-01/causal-01-answer-3.png", altKey: "answer.puddleCarComing", correct: false }
        ]
    },
    {
        id: "causal-02",
        animation: "/assets/levels/causal-02/causal-02-animation.mp4",
        keyframes: [
            "/assets/levels/causal-02/causal-02-keyframe-1.png",
            "/assets/levels/causal-02/causal-02-keyframe-2.png",
            "/assets/levels/causal-02/causal-02-keyframe-3.png"
        ],
        answers: [
            { id: "stand-by-chair", image: "/assets/levels/causal-02/causal-02-answer-1.png", altKey: "answer.rockStand", correct: false },
            { id: "lie-on-chair", image: "/assets/levels/causal-02/causal-02-answer-2.png", altKey: "answer.rockLie", correct: false },
            { id: "fall-with-chair", image: "/assets/levels/causal-02/causal-02-answer-3.png", altKey: "answer.rockFall", correct: true }
        ]
    },
    {
        id: "causal-03",
        animation: "/assets/levels/causal-03/causal-03-animation.mp4",
        keyframes: [
            "/assets/levels/causal-03/causal-03-keyframe-1.png",
            "/assets/levels/causal-03/causal-03-keyframe-2.png",
            "/assets/levels/causal-03/causal-03-keyframe-3.png"
        ],
        answers: [
            { id: "hat-against-wind", image: "/assets/levels/causal-03/causal-03-answer-1.png", altKey: "answer.hatAgainstWind", correct: false },
            { id: "hat-with-wind", image: "/assets/levels/causal-03/causal-03-answer-2.png", altKey: "answer.hatWithWind", correct: true },
            { id: "top-hat", image: "/assets/levels/causal-03/causal-03-answer-3.png", altKey: "answer.hatTop", correct: false }
        ]
    },
    {
        id: "causal-04",
        animation: "/assets/levels/causal-04/causal-04-animation.mp4",
        keyframes: [
            "/assets/levels/causal-04/causal-04-keyframe-1.png",
            "/assets/levels/causal-04/causal-04-keyframe-2.png",
            "/assets/levels/causal-04/causal-04-keyframe-3.png"
        ],
        answers: [
            { id: "ball-at-feet", image: "/assets/levels/causal-04/causal-04-answer-1.png", altKey: "answer.ballFeet", correct: false },
            { id: "ball-hits-head", image: "/assets/levels/causal-04/causal-04-answer-2.png", altKey: "answer.ballHead", correct: true },
            { id: "ball-on-slide", image: "/assets/levels/causal-04/causal-04-answer-3.png", altKey: "answer.ballSlide", correct: false }
        ]
    },
    {
        id: "causal-05",
        animation: "/assets/levels/causal-05/causal-05-animation.mp4",
        keyframes: [
            "/assets/levels/causal-05/causal-05-keyframe-1.png",
            "/assets/levels/causal-05/causal-05-keyframe-2.png",
            "/assets/levels/causal-05/causal-05-keyframe-3.png"
        ],
        answers: [
            { id: "short-skirt", image: "/assets/levels/causal-05/causal-05-answer-1.png", altKey: "answer.threadSkirt", correct: true },
            { id: "short-hair", image: "/assets/levels/causal-05/causal-05-answer-2.png", altKey: "answer.threadHair", correct: false },
            { id: "short-top", image: "/assets/levels/causal-05/causal-05-answer-3.png", altKey: "answer.threadTop", correct: false }
        ]
    },
    {
        id: "causal-06",
        animation: "/assets/levels/causal-06/causal-06-animation.mp4",
        keyframes: [
            "/assets/levels/causal-06/causal-06-keyframe-1.png",
            "/assets/levels/causal-06/causal-06-keyframe-2.png",
            "/assets/levels/causal-06/causal-06-keyframe-3.png"
        ],
        answers: [
            { id: "faucet", image: "/assets/levels/causal-06/causal-06-answer-1.png", altKey: "answer.faucet", correct: false },
            { id: "dishes", image: "/assets/levels/causal-06/causal-06-answer-2.png", altKey: "answer.dishes", correct: false },
            { id: "necklace", image: "/assets/levels/causal-06/causal-06-answer-3.png", altKey: "answer.necklace", correct: true }
        ]
        
    },
    {
        id: "emotion-01",
        animation: "/assets/levels/emotion-01/emotion-01-animation.mp4",
        keyframes: [
            "/assets/levels/emotion-01/emotion-01-keyframe-1.jpeg",
            "/assets/levels/emotion-01/emotion-01-keyframe-2.png",
            "/assets/levels/emotion-01/emotion-01-keyframe-3.png"
        ],
        answers: [
            { id: "happy", image: "/assets/levels/emotion-01/emotion-01-answer-1.jpeg", altKey: "answer.happy", correct: false },
            { id: "eating-cake", image: "/assets/levels/emotion-01/emotion-01-answer-2.png", altKey: "answer.eating-cake", correct: false },
            { id: "crying", image: "/assets/levels/emotion-01/emotion-01-answer-3.png", altKey: "answer.crying", correct: true }
        ]
    },
    {
        id: "emotion-02",
        animation: "/assets/levels/emotion-02/emotion-02-animation.mp4",
        keyframes: [
            "/assets/levels/emotion-02/emotion-02-keyframe-1.jpeg",
            "/assets/levels/emotion-02/emotion-02-keyframe-2.png",
            "/assets/levels/emotion-02/emotion-02-keyframe-3.png"
        ],
        answers: [
            { id: "no-reaction", image: "/assets/levels/emotion-02/emotion-02-answer-1.png", altKey: "answer.no-reaction", correct: false },
            { id: "drinking", image: "/assets/levels/emotion-02/emotion-02-answer-2.png", altKey: "answer.drinking", correct: false },
            { id: "terrified", image: "/assets/levels/emotion-02/emotion-02-answer-3.png", altKey: "answer.terrified", correct: true }
        ]
    },
    {
        id: "emotion-03",
        animation: "/assets/levels/emotion-03/emotion-03-animation.mp4",
        keyframes: [
            "/assets/levels/emotion-03/emotion-03-keyframe-1.png",
            "/assets/levels/emotion-03/emotion-03-keyframe-2.png",
            "/assets/levels/emotion-03/emotion-03-keyframe-3.png"
        ],
        answers: [
            { id: "angry", image: "/assets/levels/emotion-03/emotion-03-answer-1.png", altKey: "answer.angry-car-gone", correct: true },
            { id: "happy", image: "/assets/levels/emotion-03/emotion-03-answer-2.png", altKey: "answer.happy-car-gone", correct: false },
            { id: "eating-apple", image: "/assets/levels/emotion-03/emotion-03-answer-3.png", altKey: "answer.eating-apple", correct: false }
        ]
    },
    {
        id: "emotion-04",
        animation: "/assets/levels/emotion-04/emotion-04-animation.mp4",
        keyframes: [
            "/assets/levels/emotion-04/emotion-04-keyframe-1.jpeg",
            "/assets/levels/emotion-04/emotion-04-keyframe-2.png",
            "/assets/levels/emotion-04/emotion-04-keyframe-3.png"
        ],
        answers: [
            { id: "keep-eating", image: "/assets/levels/emotion-04/emotion-04-answer-1.jpeg", altKey: "answer.keep-eating", correct: false },
            { id: "throw-away", image: "/assets/levels/emotion-04/emotion-04-answer-2.jpeg", altKey: "answer.throw-away", correct: true },
            { id: "put-in-bag", image: "/assets/levels/emotion-04/emotion-04-answer-3.png", altKey: "answer.put-in-bag", correct: false }
        ]
    },
    {
        id: "emotion-05",
        animation: "/assets/levels/emotion-05/emotion-05-animation.mp4",
        keyframes: [
            "/assets/levels/emotion-05/emotion-05-keyframe-1.png",
            "/assets/levels/emotion-05/emotion-05-keyframe-2.png",
            "/assets/levels/emotion-05/emotion-05-keyframe-3.png"
        ],
        answers: [
            { id: "angry-by-win", image: "/assets/levels/emotion-05/emotion-05-answer-1.png", altKey: "answer.angry-by-win", correct: false },
            { id: "happy-with-win", image: "/assets/levels/emotion-05/emotion-05-answer-2.png", altKey: "answer.happy-with-win", correct: true },
            { id: "tapping-foot", image: "/assets/levels/emotion-05/emotion-05-answer-3.png", altKey: "answer.tapping-foot", correct: false }
        ]
    },
    {
        id: "emotion-06",
        animation: "/assets/levels/emotion-06/emotion-06-animation.mp4",
        keyframes: [
            "/assets/levels/emotion-06/emotion-06-keyframe-1.png",
            "/assets/levels/emotion-06/emotion-06-keyframe-2.png",
            "/assets/levels/emotion-06/emotion-06-keyframe-3.png"
        ],
        answers: [
            { id: "surprised-by-dog", image: "/assets/levels/emotion-06/emotion-06-answer-1.png", altKey: "answer.surprised-by-dog", correct: true },
            { id: "unphased-by-dog", image: "/assets/levels/emotion-06/emotion-06-answer-2.png", altKey: "answer.unphased-by-dog", correct: false },
            { id: "rejects-dog", image: "/assets/levels/emotion-06/emotion-06-answer-3.png", altKey: "answer.rejects-dog", correct: false }
        ]
    }
    

];
