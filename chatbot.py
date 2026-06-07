import os
import re
from groq import Groq
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="이영준 디자인 스튜디오",
    page_icon="✏️",
    layout="centered",
)

BG_IMAGE = "https://images.unsplash.com/photo-1502810190503-8303352d0dd1?fm=jpg&q=80&w=1920&auto=format&fit=crop"

st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {{
    font-family: 'Inter', sans-serif;
}}

.stApp {{
    background-image: linear-gradient(rgba(10, 12, 20, 0.75), rgba(10, 12, 20, 0.75)), url('{BG_IMAGE}');
    background-size: cover;
    background-attachment: fixed;
    background-position: center;
}}

/* 메인 콘텐츠 카드 */
.main .block-container {{
    background: #ffffff;
    border-radius: 20px;
    padding: 40px 48px 28px 48px;
    margin-top: 32px;
    margin-bottom: 32px;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
    max-width: 760px;
}}

/* 헤더 */
.chat-header {{
    text-align: center;
    padding-bottom: 24px;
    border-bottom: 2px solid #f0f0f0;
    margin-bottom: 16px;
}}

.chat-header h1 {{
    font-size: 1.6rem;
    font-weight: 800;
    color: #0a0a0a;
    letter-spacing: -0.4px;
    margin-bottom: 6px;
}}

.chat-header p {{
    font-size: 0.92rem;
    color: #666;
    margin: 0;
    line-height: 1.5;
}}

.badge {{
    display: inline-block;
    background: #eef3ff;
    color: #0057ff;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 14px;
}}

/* 채팅 메시지 */
[data-testid="stChatMessageContent"] p {{
    font-size: 1rem !important;
    line-height: 1.75 !important;
    color: #1a1a1a !important;
    margin-bottom: 0 !important;
}}

[data-testid="stChatMessage"] {{
    padding: 4px 0 !important;
    align-items: flex-start !important;
}}

[data-testid="stChatMessage"] > div {{
    align-items: flex-start !important;
}}

[data-testid="stChatMessageContent"] {{
    align-self: flex-start !important;
    justify-content: flex-start !important;
}}

/* AI 메시지 배경 */
[data-testid="stChatMessage"]:has([data-testid="stChatMessageAvatarAssistant"]) [data-testid="stChatMessageContent"] {{
    background: #f7f9ff !important;
    border-radius: 12px !important;
    padding: 14px 18px !important;
    border-left: 3px solid #0057ff !important;
}}

/* 사용자 메시지 배경 */
[data-testid="stChatMessage"]:has([data-testid="stChatMessageAvatarUser"]) [data-testid="stChatMessageContent"] {{
    background: #f5f5f5 !important;
    border-radius: 12px !important;
    padding: 14px 18px !important;
}}

/* 입력창 */
[data-testid="stChatInput"] textarea {{
    border: 2px solid #e4e4e4 !important;
    border-radius: 14px !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 1rem !important;
    padding: 14px 18px !important;
    line-height: 1.5 !important;
    color: #1a1a1a !important;
    background: #fafafa !important;
}}

[data-testid="stChatInput"] textarea:focus {{
    border-color: #0057ff !important;
    background: #fff !important;
    box-shadow: 0 0 0 3px rgba(0, 87, 255, 0.1) !important;
}}

[data-testid="stChatInput"] textarea::placeholder {{
    color: #aaa !important;
}}
</style>

<div class="chat-header">
    <div class="badge">DESIGN STUDIO</div>
    <h1>이영준 디자인 스튜디오</h1>
    <p>상세페이지 · 로고 디자인 문의를 도와드립니다</p>
</div>
""", unsafe_allow_html=True)

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

if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": "안녕하세요 👋 이영준 디자인 스튜디오입니다. 가격, 일정, 수정 횟수 등 궁금한 점을 편하게 물어보세요!",
        }
    ]

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if question := st.chat_input("궁금한 점을 입력하세요..."):
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    api_key = os.getenv("GROQ_API_KEY")

    with st.chat_message("assistant"):
        if not api_key or not api_key.startswith("gsk_"):
            reply = "현재 챗봇 설정 중입니다. 잠시 후 다시 시도해주세요."
        else:
            with st.spinner(""):
                try:
                    client = Groq(api_key=api_key)
                    history = [{"role": "system", "content": SYSTEM_PROMPT}]
                    for m in st.session_state.messages[:-1]:
                        history.append({"role": m["role"], "content": m["content"]})
                    history.append({"role": "user", "content": f"(반드시 한국어로만 답변하세요) {question}"})

                    def ask(messages):
                        return client.chat.completions.create(
                            model="llama-3.3-70b-versatile",
                            messages=messages,
                            max_tokens=512,
                        ).choices[0].message.content

                    reply = ask(history)

                    if re.search(r'[一-鿿぀-ヿ]', reply):
                        history[-1]["content"] = f"[경고: 방금 중국어나 일본어로 답변했습니다. 절대 안 됩니다. 반드시 한국어로만 답변하세요.] {question}"
                        reply = ask(history)

                except Exception:
                    reply = "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요 🙏"

        st.markdown(reply)

    st.session_state.messages.append({"role": "assistant", "content": reply})
