import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { analyzeInterviewMessages } from "@/lib/interviewAnalysis";
import type { Message } from "@/lib/schemas";
import {
  fetchInterviewExportData,
  InterviewExportError,
} from "@/lib/interviewExport";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderList = (items: string[], emptyMessage: string) => {
  if (items.length === 0) {
    return `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
  }

  return `<ul>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
};

const renderThemeList = (title: string, items: string[], emptyMessage: string) => `
  <div class="subsection">
    <h4>${escapeHtml(title)}</h4>
    ${renderList(items, emptyMessage)}
  </div>
`;

export async function GET(req: NextRequest) {
  let browser;
  try {
    const { user } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get("interviewId");

    if (!interviewId) {
      return NextResponse.json(
        { error: "Missing 'interviewId' query parameter" },
        { status: 400 }
      );
    }

    const exportData = await fetchInterviewExportData(interviewId);
    const analysis = analyzeInterviewMessages(exportData.messages as Message[], {
      totalInputTokens: exportData.totalInputTokens,
      totalOutputTokens: exportData.totalOutputTokens,
    });

    const exportDate = new Date().toLocaleDateString("fr-FR");
    const qualityLabel =
      analysis.material_quality === "exploitable"
        ? "Exploitable"
        : analysis.material_quality === "partiel"
          ? "Partiel"
          : "Insuffisant";

    const metricsHtml = [
      ["Messages etudiant", String(analysis.metrics.student_messages)],
      ["Mots produits", String(analysis.metrics.student_words)],
      ["Reponses longues", String(analysis.metrics.long_answers)],
      ["Exemples concrets", String(analysis.metrics.concrete_examples)],
      ["Questions ouvertes", `${analysis.metrics.open_question_ratio_percent}%`],
      ["Tokens totaux", String(analysis.metrics.total_tokens)],
    ]
      .map(
        ([label, value]) => `
          <div class="metric">
            <div class="metric-label">${escapeHtml(label)}</div>
            <div class="metric-value">${escapeHtml(value)}</div>
          </div>
        `
      )
      .join("");

    const alertsHtml =
      analysis.alerts && analysis.alerts.length > 0
        ? analysis.alerts
            .map(
              (alert) => `
                <div class="alert ${escapeHtml(alert.severity)}">
                  <strong>${escapeHtml(alert.severity.toUpperCase())}</strong>
                  <span>${escapeHtml(alert.message)}</span>
                </div>
              `
            )
            .join("")
        : `<p class="empty">Aucune alerte pedagogique majeure.</p>`;

    const html = `
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: "Helvetica Neue", Arial, sans-serif;
              color: #172033;
              margin: 0;
              padding: 0;
              background: #ffffff;
            }
            .container {
              padding: 32px;
            }
            .hero {
              border: 1px solid #dbe3f0;
              border-radius: 20px;
              padding: 24px;
              background: linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
              margin-bottom: 24px;
            }
            .eyebrow {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 999px;
              background: #e6eefc;
              color: #274472;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            h1 {
              font-size: 26px;
              margin: 0 0 6px 0;
            }
            h2 {
              font-size: 18px;
              margin: 0 0 10px 0;
            }
            h3 {
              font-size: 15px;
              margin: 0 0 10px 0;
            }
            h4 {
              font-size: 13px;
              margin: 0 0 8px 0;
            }
            p {
              margin: 0;
              line-height: 1.6;
              font-size: 13px;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px 20px;
              margin-top: 16px;
              font-size: 12px;
              color: #52607a;
            }
            .badges {
              margin-top: 12px;
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }
            .badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 999px;
              font-size: 11px;
              font-weight: 700;
            }
            .badge.quality {
              background: #fde68a;
              color: #92400e;
            }
            .badge.score {
              background: #dbeafe;
              color: #1d4ed8;
            }
            .section {
              border: 1px solid #e5eaf3;
              border-radius: 18px;
              padding: 18px;
              margin-bottom: 18px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .section p + p {
              margin-top: 8px;
            }
            .metrics {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 10px;
            }
            .metric {
              border: 1px solid #e5eaf3;
              border-radius: 14px;
              padding: 12px;
              background: #fbfcfe;
            }
            .metric-label {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #6b7280;
              margin-bottom: 6px;
            }
            .metric-value {
              font-size: 18px;
              font-weight: 700;
            }
            .columns {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
            }
            .subsection {
              border: 1px solid #e5eaf3;
              border-radius: 14px;
              padding: 14px;
              background: #fbfcfe;
            }
            ul {
              margin: 0;
              padding-left: 18px;
            }
            li {
              margin-bottom: 6px;
              font-size: 13px;
              line-height: 1.5;
            }
            .empty {
              color: #6b7280;
              font-size: 12px;
            }
            .alert {
              border-radius: 12px;
              padding: 10px 12px;
              margin-bottom: 8px;
              font-size: 12px;
              line-height: 1.5;
            }
            .alert.blocking { background: #fef2f2; color: #991b1b; }
            .alert.warning { background: #fff7ed; color: #9a3412; }
            .alert.info { background: #eff6ff; color: #1d4ed8; }
            .footer-note {
              margin-top: 24px;
              color: #6b7280;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="hero">
              <div class="eyebrow">Analyse pedagogique</div>
              <h1>Analyse complete de l'entretien</h1>
              <p>${escapeHtml(analysis.summary_line)}</p>
              <div class="badges">
                <span class="badge quality">${escapeHtml(qualityLabel)}</span>
                <span class="badge score">Score ${analysis.score_breakdown.total_score}/${analysis.score_breakdown.max_score}</span>
              </div>
              <div class="meta">
                <div><strong>Persona</strong> : ${escapeHtml(exportData.agentName)}</div>
                <div><strong>Etudiant</strong> : ${escapeHtml(exportData.userName)}</div>
                <div><strong>Date de l'entretien</strong> : ${escapeHtml(exportData.interviewDate)}</div>
                <div><strong>Export du</strong> : ${escapeHtml(exportDate)}</div>
              </div>
            </div>

            <div class="section">
              <h2>Synthese pedagogique</h2>
              <p><strong>${escapeHtml(analysis.feedback_title)}</strong></p>
              <p>${escapeHtml(analysis.feedback_text)}</p>
              <p><strong>Prochain geste utile :</strong> ${escapeHtml(analysis.coaching_tip)}</p>
            </div>

            <div class="section">
              <h2>Indicateurs cles</h2>
              <div class="metrics">${metricsHtml}</div>
            </div>

            <div class="section">
              <h2>Lecture pedagogique</h2>
              <div class="columns">
                <div class="subsection">
                  <h3>Ce qui est deja bien</h3>
                  ${renderList(analysis.strengths, "Aucun point fort fortifie pour le moment.")}
                </div>
                <div class="subsection">
                  <h3>Ce qui manque encore</h3>
                  ${renderList(analysis.limits, "Aucune limite majeure reperee.")}
                </div>
                <div class="subsection">
                  <h3>Comment ameliorer</h3>
                  ${renderList(analysis.next_steps, "Aucune prochaine etape specifique.")}
                </div>
              </div>
            </div>

            ${
              analysis.interview_conduct
                ? `
                  <div class="section">
                    <h2>Conduite de l'entretien</h2>
                    <p><strong>Style de question :</strong> ${escapeHtml(analysis.interview_conduct.question_style)}</p>
                    <p><strong>Qualite des relances :</strong> ${escapeHtml(analysis.interview_conduct.follow_up_quality)}</p>
                    <p><strong>Commentaire pedagogique :</strong> ${escapeHtml(analysis.interview_conduct.teacher_comment)}</p>
                    <p><strong>Messages faibles :</strong> ${analysis.interview_conduct.weak_message_signals} | <strong>Repetitions :</strong> ${analysis.interview_conduct.repeated_question_signals}</p>
                  </div>
                `
                : ""
            }

            ${
              analysis.material_reading
                ? `
                  <div class="section">
                    <h2>Lecture du materiau obtenu</h2>
                    <p><strong>Densite :</strong> ${escapeHtml(analysis.material_reading.density)}</p>
                    <p><strong>Niveau de concret :</strong> ${escapeHtml(analysis.material_reading.concrete_level)}</p>
                    <p>${escapeHtml(analysis.material_reading.teacher_comment)}</p>
                    ${renderList(
                      analysis.material_reading.contrasts_detected,
                      "Aucune tension ou contraste nettement repere."
                    )}
                  </div>
                `
                : ""
            }

            <div class="section">
              <h2>Alertes pedagogiques</h2>
              ${alertsHtml}
            </div>

            ${
              analysis.theme_coverage
                ? `
                  <div class="section">
                    <h2>Couverture des themes</h2>
                    <div class="columns">
                      ${renderThemeList("Couverts", analysis.theme_coverage.themes_covered, "Aucun theme encore vraiment couvert.")}
                      ${renderThemeList("Partiels", analysis.theme_coverage.themes_partial, "Aucun theme seulement partiel.")}
                      ${renderThemeList("A explorer", analysis.theme_coverage.themes_missing, "Rien de majeur ne manque.")}
                    </div>
                  </div>
                `
                : ""
            }

            ${
              analysis.examples
                ? `
                  <div class="section">
                    <h2>Exemples tires de l'entretien</h2>
                    <div class="columns">
                      ${renderThemeList("Questions utiles", analysis.examples.good_questions, "Pas encore d'exemple fort de question ouverte.")}
                      ${renderThemeList("Questions faibles", analysis.examples.weak_questions, "Pas de question faible reperee.")}
                      ${renderThemeList("Verbatims forts", analysis.examples.strong_verbatims, "Pas encore de verbatim vraiment fort.")}
                    </div>
                    <div class="subsection" style="margin-top: 12px;">
                      <h4>Materiau encore faible</h4>
                      ${renderList(analysis.examples.weak_material_examples, "Rien de faible de ce type n'a ete repere.")}
                    </div>
                  </div>
                `
                : ""
            }

            <p class="footer-note">
              Ce document est un retour pedagogique d'aide a la conduite d'entretien. Il complete l'entretien exporte, mais ne remplace pas une lecture critique finale par l'enseignant.
            </p>
          </div>
        </body>
      </html>
    `;

    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "24px", bottom: "24px", left: "24px", right: "24px" },
    });

    const safeAgentName = exportData.agentName.replace(/\s+/g, "-").toLowerCase();
    const fileName = `analyse-entretien-${safeAgentName}-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    if (error instanceof InterviewExportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/interviews/analysis/export GET] Error:", message);
    return NextResponse.json(
      { error: "Impossible de generer le PDF d'analyse." },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
