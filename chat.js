// Base URL for the FastAPI backend
const API_URL = "https://ladder-ai.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "login.html";
    return;
  }

  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const messageInput = document.getElementById("message-input");
  const logoutButton = document.getElementById("logout-button");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    });
  }

  appendMessage(
    "Hello there! How can I help you with your expenses today?",
    "ai",
  );

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
      appendMessage(message, "user");
      messageInput.value = "";
      await sendMessageToApi(message);
    }
  });

  async function sendMessageToApi(message) {
    const typingIndicator = showTypingIndicator();
    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message: message }),
      });

      typingIndicator.remove();

      if (response.ok) {
        const data = await response.json();

        console.log("API Response Data:", data);

        appendMessage(data.message, "ai");
      } else {
        if (response.status === 401) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("authToken");
          window.location.href = "login.html";
        } else {
          const errorData = await response.json();
          appendMessage(
            `Error: ${errorData.detail || "Something went wrong."}`,
            "ai",
            true,
          );
        }
      }
    } catch (error) {
      typingIndicator.remove();
      console.error("Chat error:", error);
      appendMessage(
        "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        "ai",
        true,
      );
    }
  }

  function appendMessage(text, sender, isError = false) {
    const messageWrapper = document.createElement("div");
    const messageBubble = document.createElement("div");

    if (sender === "user") {
      messageWrapper.className = "flex items-start justify-end gap-4";
      messageBubble.className =
        "mt-1 rounded-lg rounded-tr-none bg-primary p-3 text-white";
      messageBubble.innerHTML = `<p>${text}</p>`;
      messageWrapper.appendChild(messageBubble);
    } else {
      messageWrapper.className = "flex items-start gap-4";
      messageBubble.className = `mt-1 rounded-lg rounded-tl-none p-3 shadow-sm ${
        isError
          ? "bg-red-100 dark:bg-red-900/50"
          : "bg-white dark:bg-background-dark/80"
      }`;
      const textColor = isError
        ? "text-red-800 dark:text-red-200"
        : "text-gray-800 dark:text-gray-200";
      messageBubble.innerHTML = `<p class="${textColor}">${text}</p>`;
      const aiAvatar = document.createElement("div");
      aiAvatar.className = "size-10 flex-shrink-0 rounded-full bg-gray-200";
      messageWrapper.appendChild(aiAvatar);
      messageWrapper.appendChild(messageBubble);
    }
    chatMessages.appendChild(messageWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    const indicatorWrapper = document.createElement("div");
    indicatorWrapper.className = "flex items-start gap-4 typing-indicator";
    indicatorWrapper.innerHTML = `
            <div class="size-10 flex-shrink-0 rounded-full bg-gray-200"></div>
            <div class="mt-1 rounded-lg rounded-tl-none bg-white dark:bg-background-dark/80 p-3 shadow-sm">
                <p class="text-gray-500 dark:text-gray-400">AI is thinking...</p>
            </div>
        `;
    chatMessages.appendChild(indicatorWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return indicatorWrapper;
  }
});
