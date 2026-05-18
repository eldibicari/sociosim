"use client";

const BUBBLES: {
  text: string;
  isQuestion: boolean;
  x: string;
  y: string;
  dur: number;
  delay: number;
}[] = [
  { text: "« Je vérifie toujours »",              isQuestion: false, x: "4%",  y: "14%", dur: 18, delay: 0   },
  { text: "Comment l'utilisez-vous ?",             isQuestion: true,  x: "68%", y: "9%",  dur: 22, delay: 3.5 },
  { text: "« Ça dépend du contexte »",             isQuestion: false, x: "80%", y: "30%", dur: 20, delay: 1.2 },
  { text: "Pouvez-vous développer ?",              isQuestion: true,  x: "12%", y: "40%", dur: 17, delay: 7   },
  { text: "« Je ne lui fais pas confiance »",      isQuestion: false, x: "55%", y: "18%", dur: 25, delay: 4.8 },
  { text: "Et dans votre quotidien ?",             isQuestion: true,  x: "30%", y: "60%", dur: 19, delay: 9   },
  { text: "« C'est un outil, rien de plus »",      isQuestion: false, x: "76%", y: "65%", dur: 21, delay: 2   },
  { text: "Qu'est-ce qui vous a surpris ?",        isQuestion: true,  x: "8%",  y: "72%", dur: 16, delay: 5.5 },
  { text: "« J'ai commencé par hasard »",          isQuestion: false, x: "42%", y: "82%", dur: 23, delay: 11  },
  { text: "Comment vous positionnez-vous ?",       isQuestion: true,  x: "86%", y: "80%", dur: 18, delay: 0.8 },
  { text: "« Je recoupe toujours mes sources »",   isQuestion: false, x: "22%", y: "88%", dur: 20, delay: 6   },
  { text: "C'est quoi pour vous l'IA ?",           isQuestion: true,  x: "60%", y: "50%", dur: 24, delay: 13  },
];

export function BackgroundBubbles() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className={`convo-bubble${b.isQuestion ? " question" : ""}`}
          style={{
            left: b.x,
            top: b.y,
            "--dur": `${b.dur}s`,
            "--delay": `${b.delay}s`,
          } as React.CSSProperties}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
}
