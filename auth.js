// Base URL for the FastAPI backend
const API_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const otpForm = document.getElementById("otp-form");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }
  if (otpForm) {
    const otpMessage = document.getElementById("otp-message");
    const emailForOtp = sessionStorage.getItem("emailForOtp");
    if (emailForOtp) {
      otpMessage.textContent = `We've sent a 6-digit code to ${emailForOtp}.`;
    }
    otpForm.addEventListener("submit", handleOtpVerification);
  }
});

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("email-address").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("authToken", data.access_token);
      window.location.href = "chat_interface.html";
    } else {
      const errorData = await response.json();
      alert(`Login failed: ${errorData.detail || "Invalid credentials"}`);
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("An error occurred during login. Please try again.");
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const email = document.getElementById("email-address").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.status === 201) {
      sessionStorage.setItem("emailForOtp", email);
      window.location.href = "verify-otp.html";
      const errorData = await response.json();
      alert(`Signup failed: ${errorData.detail || "Could not create account"}`);
    }
  } catch (error) {
    console.error("Signup error:", error);
    alert("An error occurred during signup. Please try again.");
  }
}

async function handleOtpVerification(event) {
  event.preventDefault();
  const email = sessionStorage.getItem("emailForOtp");
  const code = document.getElementById("otp-code").value;

  if (!email) {
    alert("Could not find email for verification. Please sign up again.");
    window.location.href = "signup.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    if (response.ok) {
      alert("Verification successful! You can now log in.");
      sessionStorage.removeItem("emailForOtp");
      window.location.href = "login.html";
    } else {
      const errorData = await response.json();
      alert(
        `Verification failed: ${errorData.detail || "Invalid or expired OTP"}`,
      );
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    alert("An error occurred during verification. Please try again.");
  }
}
