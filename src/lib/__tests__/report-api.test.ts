import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Mock environment variables
beforeAll(() => {
  process.env.RESEND_API_KEY = "re_test_key"
  process.env.RESEND_FROM_EMAIL = "test@resend.dev"
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key"
})

// Hoist mock references so they're available inside vi.mock factories
const { mockSend, mockInsert } = vi.hoisted(() => {
  const mockSend = vi.fn()
  const mockInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: "test-uuid" } }),
    }),
  })
  return { mockSend, mockInsert }
})

// Mock @react-pdf/renderer
vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: vi.fn().mockResolvedValue(Buffer.from("fake-pdf")),
  Document: ({ children }: any) => children,
  Page: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  View: ({ children }: any) => children,
  StyleSheet: { create: (s: any) => s },
}))

// Mock resend
vi.mock("resend", () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend }
    },
  }
})

// Mock supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}))

// Import after mocks
import { POST } from "@/app/api/report/route"
import { DEFAULT_QUIZ_ANSWERS } from "../types"
import { runRulesEngine } from "../rules-engine"

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const validQuizAnswers = {
  ...DEFAULT_QUIZ_ANSWERS,
  yearLeftIndia: "2018",
  usStatus: "H1B",
  filingStatus: "Single",
  usState: "TX",
  assets: ["bank_accounts"],
  assetAmounts: { bank_accounts: "10k_50k" },
  incomeTypes: ["none"],
  filedFBAR: "no",
}

describe("POST /api/report", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ error: null })
  })

  describe("Input Validation", () => {
    it("returns 400 when email is missing", async () => {
      const req = makeRequest({ quizAnswers: validQuizAnswers })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("Missing")
    })

    it("returns 400 when quizAnswers is missing", async () => {
      const req = makeRequest({ email: "test@example.com" })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("Missing")
    })

    it("returns 400 for invalid email format", async () => {
      const req = makeRequest({ email: "not-an-email", quizAnswers: validQuizAnswers })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("Invalid email")
    })
  })

  describe("Email Sending", () => {
    it("returns 500 when Resend fails", async () => {
      mockSend.mockResolvedValue({ error: { message: "send failed" } })
      const req = makeRequest({ email: "test@example.com", quizAnswers: validQuizAnswers })
      const res = await POST(req)
      expect(res.status).toBe(500)
    })

    it("returns success when email sends successfully", async () => {
      const req = makeRequest({ email: "test@example.com", quizAnswers: validQuizAnswers })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.reportId).toBeDefined()
    })

    it("calls Resend with correct subject containing score", async () => {
      const req = makeRequest({ email: "user@test.com", quizAnswers: validQuizAnswers })
      await POST(req)

      const expectedOutput = runRulesEngine(validQuizAnswers as any)
      expect(mockSend).toHaveBeenCalledTimes(1)
      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.to).toBe("user@test.com")
      expect(callArgs.subject).toContain(String(expectedOutput.score))
      expect(callArgs.attachments).toHaveLength(1)
      expect(callArgs.attachments[0].filename).toBe("NRI-Compliance-Report.pdf")
    })
  })

  describe("Server-side Rules Engine", () => {
    it("re-runs rules engine server-side for integrity", async () => {
      const req = makeRequest({ email: "test@example.com", quizAnswers: validQuizAnswers })
      await POST(req)

      // Verify Supabase insert was called with correct score
      const expectedOutput = runRulesEngine(validQuizAnswers as any)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          score: expectedOutput.score,
          email: "test@example.com",
        })
      )
    })
  })

  describe("Database Resilience", () => {
    it("returns success even when Supabase fails (email was sent)", async () => {
      mockInsert.mockImplementation(() => { throw new Error("DB down") })
      const req = makeRequest({ email: "test@example.com", quizAnswers: validQuizAnswers })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.reportId).toBeNull()
    })
  })
})
