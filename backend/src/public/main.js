console.log("🔥 Main.js Build Version: 2025-05-23 19:00");

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function updateLoginUI() {
  // ✅ 로그아웃 직후에는 로그인 UI 띄우지 않음
  const justLoggedOut = sessionStorage.getItem("loggedOut") === "true";
  if (justLoggedOut) {
    sessionStorage.removeItem("loggedOut");
    return;
  }

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const token = localStorage.getItem("jwtToken");

  if (!loginBtn || !signupBtn) return;

  if (token) {
    loginBtn.textContent = "로그아웃";
    loginBtn.style.background = "#666";
    loginBtn.onclick = () => {
      const confirmed = confirm("로그아웃 하시겠습니까?");
      if (confirmed) {
        sessionStorage.setItem("loggedOut", "true"); // ✅ 로그아웃 상태 기록
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("loggedInUser");
        window.location.href = "/"; // ✅ 페이지 이동
      }
    };

    signupBtn.disabled = true;
    signupBtn.style.background = "#ccc";
    signupBtn.style.cursor = "not-allowed";
  } else {
    loginBtn.textContent = "로그인";
    loginBtn.style.background = "#00c851";
    loginBtn.onclick = () => {
      const modal = document.getElementById("loginModal");
      if (modal) {
        modal.style.display = "flex";
        showLogin();
      }
    };

    signupBtn.disabled = false;
    signupBtn.style.background = "#00c851";
    signupBtn.style.cursor = "pointer";
    signupBtn.onclick = () => {
      const modal = document.getElementById("loginModal");
      if (modal) {
        modal.style.display = "flex";
        showSignup();
      }
    };
  }
}

async function fetchMyInfo() {
  const token = localStorage.getItem("jwtToken");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn("/api/me 응답 실패", res.status);
      throw new Error("인증 실패");
    }

    await res.json();
  } catch (err) {
    localStorage.removeItem("jwtToken");
  }

  updateLoginUI();
}

function showMessage(message, type = "info", duration = 3000) {
  const msgBox = document.getElementById("authMessage");
  if (!msgBox) return;
  msgBox.textContent = message;
  msgBox.style.textAlign = "center";
  msgBox.style.fontSize = "1.2rem";
  msgBox.style.fontWeight = "bold";
  msgBox.style.padding = "10px";
  msgBox.style.background = "white";
  msgBox.style.color = type === "error" ? "red" : type === "success" ? "#007bff" : "black";
  if (type === "success") {
    setTimeout(() => { msgBox.textContent = ""; }, duration);
  }
}

function closeModal() {
  const modal = document.getElementById("loginModal");
  if (modal) modal.style.display = "none";
}

function showLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("signupForm").style.display = "none";
}

function showSignup() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";
}

document.getElementById("tabLogin")?.addEventListener("click", showLogin);
document.getElementById("tabSignup")?.addEventListener("click", showSignup);

document.getElementById("findId")?.addEventListener("click", async (e) => {
  e.preventDefault();

  const name = prompt("가입 시 입력한 이름을 입력해주세요:");
  if (!name || name.trim().length < 2) {
    alert("이름을 올바르게 입력해주세요.");
    return;
  }

  const birth = prompt("가입 시 입력한 생년월일 (YYYY-MM-DD 형식):");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
    alert("생년월일은 YYYY-MM-DD 형식으로 입력해주세요.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/find-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), birth: birth.trim() })
    });

    const data = await res.json();
    if (data && data.id) {
      alert(`✅ 가입된 아이디: ${data.id}\n(비밀번호는 관리자에게 초기화를 요청해주세요)`);
    } else {
      alert("❌ 일치하는 계정 정보가 없습니다.");
    }
  } catch (err) {
    alert("⚠️ 서버 오류가 발생했습니다.");
  }
});

document.getElementById("findPassword")?.addEventListener("click", (e) => {
  e.preventDefault();
  alert("🔐 비밀번호 초기화는 현재 지원되지 않습니다.\n관리자에게 문의해주세요.");
});

function loginWithProvider(provider) {
  const redirectUri = encodeURIComponent('https://samspeakgo.com/oauth2callback.html');
  let url = "";
  let clientId = "";

  switch (provider) {
    case 'google':
      clientId = '925681825495-78b1e74h3oilhd3qtv4g5e746gda5hk1.apps.googleusercontent.com';
      url = `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code` +
        `&scope=profile email` +
        `&access_type=offline` +
        `&prompt=consent` + // 선택사항
        `&state=google`;     // ⭐ 반드시 있어야 oauth2callback에서 provider 추론 가능
      break;

    case 'kakao':
      clientId = '9e5e840bebeea56af25cb779aebb865c';
      url = `https://auth.kakao.com/oauth/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code` +
        `&state=kakao`;
      break;

    case 'facebook':
      url = `${API_BASE}/api/oauth/facebook?state=facebook:web`;
      break;

    case 'naver':
      clientId = '0MBpnd532F_5iGYXoOHe';
      url = `https://nid.naver.com/oauth2.0/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code` +
        `&state=naver`;
      break;

    case 'line':
      clientId = '2007472867';
      url = `https://access.line.me/oauth2/v2.1/authorize` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&state=line` +
        `&scope=profile%20openid%20email`;
      break;

    case 'yahoo':
      clientId = 'dj0yJmk9aDRZTjJMUkxXNG5rJmQ9WVdrOVVYRm9ja1ZMVTNFbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWYz';
      url = `https://api.login.yahoo.com/oauth2/request_auth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code` +
        `&state=yahoo`;
      break;

    default:
      alert("⚠️ 지원되지 않는 로그인 방식입니다.");
      return;
  }

  window.location.href = url;
}

// optional dummy if referenced
function loginWithFacebook() {
  alert("🔗 페이스북 로그인 기능은 준비 중입니다.");
}

document.addEventListener("DOMContentLoaded", function () {
  const langSelect = document.getElementById("langSelect");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const signupEmailInput = document.getElementById("signupEmail");
  const emailStatusBox = document.getElementById("emailStatus");
  const loginEmailInput = document.getElementById("loginEmail");
  const loginPasswordInput = document.getElementById("loginPassword");
  const modal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const savedEmail = localStorage.getItem("rememberedEmail");
  const savedPassword = localStorage.getItem("rememberedPassword");
  const rememberEmailCheckbox = document.getElementById("rememberEmail");
  const rememberPasswordCheckbox = document.getElementById("rememberPassword");

  window.API_BASE = location.hostname === "localhost" ? "http://localhost:5000" : "https://samspeakgo.com";

  langSelect?.addEventListener("change", function () {
    if (this.value !== "#") window.location.href = this.value;
  });

  loginBtn?.addEventListener("click", () => modal && (modal.style.display = "flex", showLogin()));
  signupBtn?.addEventListener("click", () => modal && (modal.style.display = "flex", showSignup()));

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user_id = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!user_id || !password) return showMessage("❌ 로그인 실패: 아이디와 비밀번호는 필수입니다.", "error");

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user_id, password })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        if (result.token) {
          localStorage.setItem("jwtToken", result.token);
        }

        localStorage.setItem("loggedInUser", result.user?.id || user_id);

        rememberEmailCheckbox?.checked
          ? localStorage.setItem("rememberedEmail", user_id)
          : localStorage.removeItem("rememberedEmail");

        rememberPasswordCheckbox?.checked
          ? localStorage.setItem("rememberedPassword", password)
          : localStorage.removeItem("rememberedPassword");

        await fetchMyInfo();
        updateLoginUI();
        setTimeout(closeModal, 1500);
      } else {
        showMessage("❌ 로그인 실패: " + result.message, "error");
      }
    } catch (err) {
      console.error("❌ 서버 응답 오류", err);
      showMessage("⚠️ 서버 연결 실패", "error");
    }
  });

  signupForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const user_id = document.getElementById("signupId").value.trim();
    const name = document.getElementById("signupName").value.trim();
    const birth = document.getElementById("signupBirth").value;
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;

    if (!user_id || !name || !birth) {
      return showMessage("📛 모든 필드를 입력해주세요", "error");
    }
    if (password.length < 8) {
      return showMessage("🔒 비밀번호는 최소 8자 이상", "error");
    }
    if (password !== confirm) {
      return showMessage("❗ 비밀번호가 일치하지 않습니다", "error");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
      return showMessage("📅 생년월일은 YYYY-MM-DD 형식으로 입력해주세요", "error");
    }

    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user_id, name, birth, password })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        showMessage("🎉 가입 성공!", "success");
        setTimeout(() => {
          showLogin();
        }, 1500);
      } else {
        showMessage("🚫 가입 실패: " + (result.message || "알 수 없는 오류"), "error");
      }
    } catch (err) {
      showMessage("⚠️ 서버 오류: " + err.message, "error");
    }
  });

  if (savedEmail) {
    const loginIdInput = document.getElementById("loginId");
    if (loginIdInput) loginIdInput.value = savedEmail;
    if (rememberEmailCheckbox) rememberEmailCheckbox.checked = true;
  }
  if (savedPassword) {
    loginPasswordInput.value = savedPassword;
    document.getElementById("rememberPassword").checked = true;
  }

  if (loginBtn && modal) {
    loginBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  }

  document.getElementById("tabLogin")?.setAttribute("type", "button");
  document.getElementById("tabSignup")?.setAttribute("type", "button");

  const translations = {
    ko: {
      login: "로그인",
      signup: "회원가입",
      test_message: "테스트 페이지입니다. 다른 언어로 이동하려면 다운로 메뉴를 이용하세요.",
      signup_section: "회원가입 세관"
    },
    ja: {
      login: "ログイン",
      signup: "新規登録",
      test_message: "これはテストページです。別の言語に移動するにはドロップダウンを使用してください。",
      signup_section: "登録セクション"
    },
    zh: {
      login: "登陆",
      signup: "注册",
      test_message: "这是一个测试页面，请使用下拉选择转到其他语言。",
      signup_section: "注册部分"
    },
    vi: {
      login: "Đăng nhập",
      signup: "Đăng ký",
      test_message: "Đây là trang thử nghiệm. Hãy sử dụng menu để chuyển sang ngôn ngữ khác.",
      signup_section: "Mục Đăng Ký"
    }
  };

  const lang = document.documentElement.lang || 'en';

  if (translations[lang]) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang][key]) el.textContent = translations[lang][key];
    });

    // Update social icons
    document.querySelectorAll(".social-icon").forEach(icon => {
      const oldSrc = icon.getAttribute("src");
      const updatedSrc = oldSrc.replace(/\/assets\/icons\/[^/]+\//, `/assets/icons/${lang}/`);
      icon.setAttribute("src", updatedSrc);
    });
  }

  const langSelect = document.getElementById("langSelect");
  if (langSelect) {
    langSelect.addEventListener("change", function () {
      if (this.value !== "#") window.location.href = this.value;
    });
  }


  signupEmailInput?.addEventListener("input", checkEmailAvailability);
  signupEmailInput?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      checkEmailAvailability();
    }
  });

  async function checkEmailAvailability() {
    const email = signupEmailInput.value.trim();
    if (!emailStatusBox || email === "") return emailStatusBox.textContent = "";

    if (!isValidEmail(email)) {
      emailStatusBox.textContent = "📛 이메일 형식이 올바르지 않거나 지원되지 않는 도메인입니다.";
      emailStatusBox.style.color = "red";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const result = await res.json();
      if (result.exists) {
        emailStatusBox.textContent = "🚫 이미 가입된 이메일입니다.";
        emailStatusBox.style.color = "red";
      } else {
        emailStatusBox.textContent = "✅ 사용 가능한 이메일입니다.";
        emailStatusBox.style.color = "#007bff";
      }
    } catch (err) {
      emailStatusBox.textContent = "⚠️ 이메일 확인 중 오류";
      emailStatusBox.style.color = "red";
    }
  }

  fetchMyInfo();
  document.getElementById("tabLogin")?.addEventListener("click", showLogin);
  document.getElementById("tabSignup")?.addEventListener("click", showSignup);
});

window.showSignup = showSignup;
window.showLogin = showLogin;
window.closeModal = closeModal;
window.loginWithProvider = loginWithProvider;
window.loginWithFacebook = loginWithFacebook;