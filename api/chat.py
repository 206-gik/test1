from http.server import BaseHTTPRequestHandler
import json
import os
import re
from groq import Groq

SYSTEM_PROMPT = """[CRITICAL RULE - ABSOLUTE PRIORITY]
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
- AI스러운 딱딱한 문장"""


def generate_reply(question: str, history: list) -> str:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": f"(반드시 한국어로만 답변하세요) {question}"})

    def call(msgs):
        return client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=msgs,
            max_tokens=512,
        ).choices[0].message.content

    reply = call(messages)

    if re.search(r"[一-鿿぀-ヿ]", reply):
        messages[-1]["content"] = f"[경고: 방금 중국어나 일본어로 답변했습니다. 반드시 한국어로만 답변하세요.] {question}"
        reply = call(messages)

    return reply


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self._send(200, {})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length))
            reply = generate_reply(data.get("question", ""), data.get("history", []))
            self._send(200, {"reply": reply})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def _send(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def log_message(self, format, *args):
        pass
