import os
from groq import Groq
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="이영준 클라이언트 응대 AI 비서", page_icon="✉️", layout="wide")

BG_IMAGE = "https://images.unsplash.com/photo-1502810190503-8303352d0dd1?fm=jpg&q=80&w=1920&auto=format&fit=crop"

st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {{
    font-family: 'Inter', sans-serif;
}}

.stApp {{
    background-image: linear-gradient(rgba(10, 12, 20, 0.72), rgba(10, 12, 20, 0.72)), url('{BG_IMAGE}');
    background-size: cover;
    background-attachment: fixed;
    background-position: center;
}}

/* 메인 콘텐츠 카드 */
.main .block-container {{
    background: rgba(255, 255, 255, 0.97);
    border-radius: 20px;
    padding: 48px 52px;
    margin-top: 32px;
    margin-bottom: 32px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(12px);
}}

/* 사이드바 */
section[data-testid="stSidebar"] {{
    background: rgba(255, 255, 255, 0.97) !important;
    border-right: none !important;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}}

section[data-testid="stSidebar"] * {{
    color: #1a1a1a !important;
}}

/* 헤더 */
.main-header {{
    margin-bottom: 36px;
    padding-bottom: 28px;
    border-bottom: 1px solid #ebebeb;
}}

.main-header h1 {{
    font-size: 2rem;
    font-weight: 800;
    color: #0a0a0a;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
}}

.main-header p {{
    font-size: 0.95rem;
    color: #777;
    margin: 0;
}}

/* 라벨 */
.card-label {{
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #0057ff;
    margin-bottom: 8px;
}}

.sidebar-title {{
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #0057ff;
    margin-bottom: 16px;
}}

/* 입력창 */
.stTextArea textarea, .stTextInput input {{
    border: 1.5px solid #e4e4e4 !important;
    border-radius: 10px !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 0.95rem !important;
    color: #1a1a1a !important;
    background: #fafafa !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
}}

.stTextArea textarea:focus, .stTextInput input:focus {{
    border-color: #0057ff !important;
    background: #fff !important;
    box-shadow: 0 0 0 3px rgba(0, 87, 255, 0.1) !important;
}}

/* 버튼 */
.stButton > button {{
    background-color: #0057ff !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 10px !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 700 !important;
    font-size: 0.95rem !important;
    padding: 14px 28px !important;
    letter-spacing: 0.2px !important;
    transition: background-color 0.2s, transform 0.1s !important;
}}

.stButton > button:hover {{
    background-color: #0040cc !important;
    transform: translateY(-1px) !important;
}}

.stButton > button:active {{
    transform: translateY(0px) !important;
}}

/* 결과 라벨 */
.result-label {{
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #0057ff;
    margin-top: 28px;
    margin-bottom: 8px;
}}

div[data-testid="stAlert"] {{
    border-radius: 10px !important;
}}

h2, h3 {{
    color: #0a0a0a !important;
    font-weight: 700 !important;
}}

label {{
    color: #1a1a1a !important;
    font-weight: 600 !important;
    font-size: 0.9rem !important;
}}
</style>

<div class="main-header">
    <h1>클라이언트 응대 AI 비서</h1>
    <p>댓글이나 질문을 붙여넣으면 이영준님의 정책에 맞는 답장 초안을 생성합니다.</p>
</div>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown('<div class="sidebar-title">서비스 정책 설정</div>', unsafe_allow_html=True)
    st.info("아래 정보를 실제 정책에 맞게 수정해주세요.")

    price_page = st.text_input("상세페이지 디자인 가격", value="50~100만원")
    price_logo = st.text_input("로고 디자인 가격", value="30~50만원")
    duration_page = st.text_input("상세페이지 제작 기간", value="7~10일")
    duration_logo = st.text_input("로고 제작 기간", value="3~5일")
    revisions = st.text_input("수정 횟수 정책", value="3회")
    deposit = st.text_input("계약금 정책", value="총 금액의 50%, 작업 시작 전 선납")
    extra_info = st.text_area("추가 안내 (선택)", value="", height=80)

st.markdown('<div class="card-label">댓글 내용</div>', unsafe_allow_html=True)
question = st.text_area(
    label="댓글 내용",
    placeholder='예: "디자인 가격이 얼마인가요?" / "언제까지 완성 가능한가요?"',
    height=140,
    label_visibility="collapsed",
)

st.markdown("<br>", unsafe_allow_html=True)

if st.button("답장 초안 생성", type="primary", use_container_width=True):
    if not question.strip():
        st.warning("댓글 내용을 붙여넣어 주세요.")
    else:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or not api_key.startswith("gsk_"):
            st.error("API 키가 설정되지 않았습니다. `.env` 파일에 `GROQ_API_KEY`를 입력해주세요.")
        else:
            extra_line = f"\n- 추가 안내: {extra_info}" if extra_info.strip() else ""
            system_prompt = f"""당신은 이영준의 디자인 서비스 클라이언트 응대 비서입니다.
다음 정책을 바탕으로 친절하고 전문적인 답장 초안을 작성하세요.

[언어 규칙]
- 반드시 한국어로만 답변하세요. 영어, 중국어 등 다른 언어는 절대 사용하지 마세요.

[서비스 정책]
- 상세페이지 디자인 가격: {price_page}
- 로고 디자인 가격: {price_logo}
- 상세페이지 제작 기간: {duration_page}
- 로고 제작 기간: {duration_logo}
- 수정 횟수: {revisions}
- 계약금: {deposit}{extra_line}

답장 작성 기준:
- 실제 사람이 카카오톡이나 DM으로 보내는 것처럼 자연스럽게 작성
- 짧고 직접적으로, 필요한 정보만 담기
- 200자 내외로 간결하게
- 이모지를 자연스럽게 사용할 것 (과하지 않게 1~2개)

절대 쓰지 말 것:
- "안녕하세요! 문의해 주셔서 감사합니다" 같은 과도한 인사
- "더 궁금한 점이 있으시면 언제든지 말씀해 주세요" 같은 클리셰 마무리
- "~드리겠습니다", "~해드릴 수 있습니다" 남용
- 항목을 번호나 글머리 기호(•, -, 1.)로 나열하는 방식
- AI가 쓴 것 같은 딱딱하고 공식적인 문장

자연스러운 예시:
"안녕하세요~ 상세페이지 디자인은 보통 50~100만원 사이로 진행되고, 작업 기간은 7~10일 정도예요. 규모나 요구사항에 따라 달라질 수 있어서 간단히 내용 공유해 주시면 더 정확히 안내해 드릴게요 😊"

어색한 예시 (이렇게 쓰지 말 것):
"안녕하세요! 문의해 주셔서 감사합니다. 저희 서비스 가격은 다음과 같습니다. 1. 상세페이지 디자인: 50~100만원 2. 제작 기간: 7~10일 더 궁금한 점이 있으시면 언제든지 말씀해 주세요." """

            with st.spinner("답장 초안을 생성 중입니다..."):
                try:
                    client = Groq(api_key=api_key)
                    response = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": question},
                        ],
                        max_tokens=1024,
                    )
                    response_text = response.choices[0].message.content

                    st.success("답장 초안이 생성되었습니다.")
                    st.markdown('<div class="result-label">생성된 답장 초안</div>', unsafe_allow_html=True)
                    st.text_area(
                        label="result",
                        value=response_text,
                        height=300,
                        label_visibility="collapsed",
                    )
                except Exception as e:
                    if "invalid_api_key" in str(e).lower() or "authentication" in str(e).lower():
                        st.error("API 키가 올바르지 않습니다. `.env` 파일의 `GROQ_API_KEY`를 확인해주세요.")
                    elif "rate_limit" in str(e).lower():
                        st.error("잠시 후 다시 시도해주세요. (요청 한도 초과)")
                    else:
                        st.error(f"오류가 발생했습니다: {e}")
