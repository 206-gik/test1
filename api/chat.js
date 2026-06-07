const Groq = require("groq-sdk");

const SYSTEM_PROMPT = `[CRITICAL RULE - ABSOLUTE PRIORITY]
You MUST write ONLY in Korean (한국어).
NEVER use Chinese (중국어), English, Japanese, or any other language.
Every single character of your response must be Korean. No exceptions.

당신은 이영준 디자인 스튜디오의 친절한 상담 챗봇입니다.
클라이언트의 질문에 자연스럽고 따뜻하게 한국어로만 답변하세요.

[서비스 정책]
- 상세페이지 디자인 가격: 1~30만원 (규모에 따라 협의)
- 로고 디자인 가격: 5~30만원
- 상세페이지 제작 기간: 3~10일
- 로고 제작 기간: 1~3일
- 수정 횟수: 3회
- 계약금: 총 금액의 10%, 작업 시작 전 선납

[답변 규칙]
- 반드시 한국어로만 답변
- 실제 사람이 카카오톡 DM으로 보내는 것처럼 자연스럽게
- 짧고 직접적으로, 200자 내외
- 이모지 1~2개 자연스럽게 사용
- 가격/일정/수정/계약금 외의 질문은 "자세한 내용은 직접 상담을 통해 안내드릴게요 😊"로 마무리

절대 쓰지 말 것:
- 클리셰 마무리 ("더 궁금한 점이 있으시면 언제든지...")
- 글머리 기호나 번호 목록 나열
- AI스러운 딱딱한 문장`;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, history = [] } = req.body;
  if (!question) return res.status(400).json({ error: "No question" });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요." });
  }

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: `(반드시 한국어로만 답변하세요) ${question}` },
    ];

    const call = async (msgs) => {
      const r = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: msgs,
        max_tokens: 512,
      });
      return r.choices[0].message.content;
    };

    let reply = await call(messages);

    if (/[一-鿿぀-ヿ]/.test(reply)) {
      messages[messages.length - 1].content = `[경고: 방금 중국어나 일본어로 답변했습니다. 반드시 한국어로만 답변하세요.] ${question}`;
      reply = await call(messages);
    }

    res.json({ reply });
  } catch (e) {
    console.error("API 오류:", e);
    res.status(500).json({ error: e.message || "알 수 없는 오류" });
  }
};
