import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { PDFReport } from "@/lib/pdf-report";
import ReportEmail from "@/emails/report-email";
import { QuizAnswers, RulesEngineOutput } from "@/lib/types";
import { runRulesEngine } from "@/lib/rules-engine";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, quizAnswers } = body as {
      email: string;
      quizAnswers: QuizAnswers;
    };

    // Validate inputs
    if (!email || !quizAnswers) {
      return NextResponse.json(
        { error: "Missing email or quizAnswers" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Re-run rules engine server-side for integrity
    const rulesOutput: RulesEngineOutput = runRulesEngine(quizAnswers);

    // Generate PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(PDFReport, { output: rulesOutput }) as any
    );

    const urgentCount = rulesOutput.results.filter(
      (r) => r.severity === "urgent"
    ).length;
    const warningCount = rulesOutput.results.filter(
      (r) => r.severity === "warning"
    ).length;
    const infoCount = rulesOutput.results.filter(
      (r) => r.severity === "info"
    ).length;

    // Send email with PDF attachment
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "IndiaOS <onboarding@resend.dev>",
      to: email,
      subject: `Your NRI Compliance Report (Score: ${rulesOutput.score}/100)`,
      react: React.createElement(ReportEmail, {
        score: rulesOutput.score,
        urgentCount,
        warningCount,
        infoCount,
        penaltyMax: rulesOutput.totalPenaltyMax,
      }),
      attachments: [
        {
          filename: "NRI-Compliance-Report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Save to Supabase (non-blocking — email already sent)
    let reportId: string | null = null;
    try {
      const { data } = await supabaseAdmin
        .from("reports")
        .insert({
          email,
          quiz_answers: quizAnswers,
          score: rulesOutput.score,
          total_penalty_min: rulesOutput.totalPenaltyMin,
          total_penalty_max: rulesOutput.totalPenaltyMax,
          results: rulesOutput.results,
          urgent_count: urgentCount,
          warning_count: warningCount,
          info_count: infoCount,
        })
        .select("id")
        .single();

      reportId = data?.id ?? null;
    } catch (dbError) {
      // DB failure is non-fatal — email was already sent
      console.error("Supabase insert error:", dbError);
    }

    return NextResponse.json({ success: true, reportId });
  } catch (err) {
    console.error("Report API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
