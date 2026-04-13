import { describe, expect, it } from "vitest";
import { analyzeInterviewMessages } from "@/lib/interviewAnalysis";
import type { Message } from "@/lib/schemas";

function makeMessage(id: string, role: "user" | "assistant", content: string): Message {
  return {
    id,
    session_id: "11111111-1111-1111-1111-111111111111",
    role,
    content,
    input_tokens: null,
    output_tokens: null,
    created_at: "2026-04-13T12:00:00.000Z",
  };
}

describe("analyzeInterviewMessages", () => {
  it("evaluates the student material from assistant replies, not the interviewer prompts", () => {
    const analysis = analyzeInterviewMessages(
      [
        makeMessage("1", "user", "Comment utilises-tu l'IA dans tes cours ?"),
        makeMessage(
          "2",
          "assistant",
          "J'utilise ChatGPT surtout quand je prepare un expose. Par exemple, la semaine derniere, je lui ai demande de m'aider a clarifier un plan de dissertation en sociologie, puis j'ai tout repris avec mes propres notes."
        ),
        makeMessage("3", "user", "Peux-tu me raconter une autre situation ?"),
        makeMessage(
          "4",
          "assistant",
          "Oui. En cours de methodologie, je m'en sers quand je bloque sur une formulation. Une fois, je lui ai demande plusieurs reformulations pour comparer, puis j'ai garde seulement une idee que j'ai retravaillee moi-meme."
        ),
        makeMessage("5", "user", "Dans quel cas est-ce que cela t'aide vraiment ?"),
        makeMessage(
          "6",
          "assistant",
          "Cela m'aide surtout au debut, quand je suis perdue. Ensuite, je reprends la main parce que j'ai besoin de comprendre pourquoi une proposition est meilleure qu'une autre."
        ),
      ],
      { totalInputTokens: 950, totalOutputTokens: 1300 }
    );

    expect(analysis.material_quality).not.toBe("insuffisant");
    expect(analysis.metrics.student_messages).toBe(3);
    expect(analysis.signals.interviewer_message_count).toBe(3);
  });

  it("keeps a truly short interview in insuffisant", () => {
    const analysis = analyzeInterviewMessages(
      [
        makeMessage("1", "user", "Tu utilises l'IA ?"),
        makeMessage("2", "assistant", "Oui, parfois."),
      ],
      { totalInputTokens: 80, totalOutputTokens: 60 }
    );

    expect(analysis.material_quality).toBe("insuffisant");
    expect(analysis.score_breakdown.volume_score).toBe(0);
  });

  it("returns richer metrics and scores for an exploitable interview", () => {
    const analysis = analyzeInterviewMessages(
      [
        makeMessage("1", "user", "Peux-tu me raconter comment tu utilises l'IA dans tes cours ?"),
        makeMessage(
          "2",
          "assistant",
          "Dans plusieurs cours, j'utilise l'IA pour demarrer. Par exemple, quand je prepare un dossier, je lui demande d'abord de me lister des pistes, puis je compare avec le syllabus et mes notes. Cela m'aide a gagner du temps, mais je garde une distance critique."
        ),
        makeMessage("3", "user", "Pourquoi dis-tu que tu gardes une distance critique ?"),
        makeMessage(
          "4",
          "assistant",
          "Parce que je me suis deja rendu compte que certaines suggestions etaient trop generiques. Une fois, en cours de genre, j'ai recu une reponse tres plate. Du coup, j'ai appris a verifier, a croiser avec mes lectures et a reformuler moi-meme."
        ),
        makeMessage("5", "user", "Dans quel cas l'IA te met-elle en difficulte ?"),
        makeMessage(
          "6",
          "assistant",
          "Quand je suis fatiguee, j'ai tendance a accepter trop vite une proposition. En stage aussi, je fais attention, parce que l'enjeu n'est pas seulement de produire vite, mais de rester coherente avec ce que j'ai vraiment observe."
        ),
        makeMessage("7", "user", "Peux-tu decrire une situation recente precise ?"),
        makeMessage(
          "8",
          "assistant",
          "La derniere fois, pour un expose, j'ai compare trois formulations proposees par l'IA. J'ai garde une structure, j'ai rejete deux exemples trop stereotypes et j'ai complete avec un article de Becker. C'est la comparaison qui a ete utile, pas la reponse brute."
        ),
        makeMessage("9", "user", "Comment cela change-t-il selon les cours ?"),
        makeMessage(
          "10",
          "assistant",
          "En methodologie, je l'utilise surtout pour clarifier un plan. En theorie, beaucoup moins, parce que j'ai besoin de travailler les concepts par moi-meme. Donc l'usage depend vraiment du type de travail et du niveau d'exigence du cours."
        ),
      ],
      { totalInputTokens: 1600, totalOutputTokens: 2200 }
    );

    expect(analysis.material_quality).toBe("exploitable");
    expect(analysis.metrics.total_tokens).toBe(3800);
    expect(analysis.metrics.open_question_ratio_percent).toBeGreaterThanOrEqual(80);
    expect(analysis.score_breakdown.total_score).toBeGreaterThanOrEqual(8);
    expect(analysis.summary_line).toContain("Base deja exploitable");
  });
});
