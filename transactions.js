// Base URL for the FastAPI backend
const API_URL = "https://ladder-ai.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "login.html";
    return;
  }

  const transactionTableBody = document.getElementById(
    "transaction-table-body",
  );
  const logoutButton = document.getElementById("logout-button");
  const loadMoreButton = document.getElementById("load-more-button");

  const editModal = document.getElementById("edit-expense-modal");
  const editForm = document.getElementById("edit-expense-form");
  const closeModalButton = document.getElementById("close-edit-modal-button");

  const receiptModal = document.getElementById("receipt-modal");
  const openReceiptModalButton = document.getElementById(
    "open-receipt-modal-button",
  );
  const closeReceiptModalButton = document.getElementById(
    "close-receipt-modal-button",
  );
  const receiptUploadForm = document.getElementById("receipt-upload-form");
  const receiptFileInput = document.getElementById("receipt-file-input");
  const receiptChatContainer = document.getElementById(
    "receipt-chat-container",
  );
  const receiptChatMessages = document.getElementById("receipt-chat-messages");
  const receiptChatInput = document.getElementById("receipt-chat-input");
  const receiptChatSend = document.getElementById("receipt-chat-send");

  let currentExpenseId = null;
  let transactionsOffset = 0;
  const transactionsLimit = 10;

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    });
  }

  transactionTableBody.addEventListener("click", async (event) => {
    if (event.target.classList.contains("edit-button")) {
      const expenseId = event.target.dataset.expenseId;
      await openEditModal(expenseId, authToken);
    }
  });

  closeModalButton.addEventListener("click", () =>
    editModal.classList.add("hidden"),
  );
  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleUpdateExpense(authToken, transactionTableBody);
  });

  openReceiptModalButton.addEventListener("click", () => {
    receiptModal.classList.remove("hidden");
    currentExpenseId = null;
    receiptChatContainer.classList.add("hidden");
    receiptChatMessages.innerHTML = "";
  });
  closeReceiptModalButton.addEventListener("click", () =>
    receiptModal.classList.add("hidden"),
  );

  receiptUploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = receiptFileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/expenses/receipt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (response.ok) {
        const expenses = await response.json();
        transactionsOffset = 0; // Reset offset to show the new items
        transactionTableBody.innerHTML = ""; // Clear the table
        fetchTransactions(authToken, transactionTableBody);
        receiptChatContainer.classList.remove("hidden");
        receiptChatMessages.innerHTML += `<div class="text-sm text-gray-500 dark:text-gray-400">Created ${expenses.length} expenses from the receipt.</div>`;
        currentExpenseId = expenses[0].receipt_group_id; // Use receipt_group_id for context
        receiptFileInput.value = "";
      } else {
        console.error("Failed to process receipt");
        alert("Failed to process receipt. Please try again.");
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("An error occurred while processing the receipt.");
    }
  });

  receiptChatSend.addEventListener("click", async () => {
    const message = receiptChatInput.value.trim();
    if (!message) return;

    receiptChatMessages.innerHTML += `<div class="text-right text-sm text-gray-900 dark:text-white p-2">${message}</div>`;
    receiptChatInput.value = "";

    const url = currentExpenseId
      ? `${API_URL}/chat?expense_id=${currentExpenseId}`
      : `${API_URL}/chat`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const data = await response.json();
        receiptChatMessages.innerHTML += `<div class="text-sm text-gray-500 dark:text-gray-400 p-2">${data.message}</div>`;
      } else {
        console.error("Failed to send chat message");
        receiptChatMessages.innerHTML += `<div class="text-sm text-red-500 p-2">Error sending message.</div>`;
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      receiptChatMessages.innerHTML += `<div class="text-sm text-red-500 p-2">Could not connect to the chat service.</div>`;
    }
  });

  loadMoreButton.addEventListener("click", () => {
    transactionsOffset += transactionsLimit;
    fetchTransactions(authToken, transactionTableBody, false);
  });

  async function fetchTransactions(token, tableBody, clearTable = true) {
    if (clearTable) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10">Loading...</td></tr>`;
    }

    try {
      const response = await fetch(
        `${API_URL}/expenses?skip=${transactionsOffset}&limit=${transactionsLimit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const expenses = await response.json();
        if (clearTable) {
          tableBody.innerHTML = "";
        }
        if (expenses.length === 0 && clearTable) {
          showEmptyMessage(tableBody);
        } else {
          expenses.forEach((expense) => {
            const row = createTableRow(expense);
            tableBody.appendChild(row);
          });
        }
        loadMoreButton.classList.toggle(
          "hidden",
          expenses.length < transactionsLimit,
        );
      } else {
        if (response.status === 401) {
          window.location.href = "login.html";
        } else {
          showErrorMessage(tableBody);
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      showErrorMessage(tableBody);
    }
  }

  fetchTransactions(authToken, transactionTableBody);
});

async function openEditModal(expenseId, token) {
  try {
    const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      alert("Could not fetch expense details.");
      return;
    }
    const expense = await response.json();

    document.getElementById("edit-expense-id").value = expense.id;
    document.getElementById("edit-description").value = expense.description;
    document.getElementById("edit-amount").value = expense.amount;
    document.getElementById("edit-category").value = expense.category || "";
    document.getElementById("edit-date").value = new Date(expense.date)
      .toISOString()
      .split("T")[0];

    document.getElementById("edit-expense-modal").classList.remove("hidden");
  } catch (error) {
    console.error("Error fetching expense details:", error);
    alert("An error occurred while fetching expense details.");
  }
}

async function handleUpdateExpense(token, tableBody) {
  const expenseId = document.getElementById("edit-expense-id").value;
  const expenseData = {
    description: document.getElementById("edit-description").value,
    amount: parseFloat(document.getElementById("edit-amount").value),
    category: document.getElementById("edit-category").value,
    date: new Date(document.getElementById("edit-date").value).toISOString(),
  };

  try {
    const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(expenseData),
    });

    if (response.ok) {
      document.getElementById("edit-expense-modal").classList.add("hidden");
      transactionsOffset = 0; // Reset offset to show the updated item
      fetchTransactions(token, tableBody);
    } else {
      const errorData = await response.json();
      alert(
        `Update failed: ${errorData.detail || "Could not update expense."}`,
      );
    }
  } catch (error) {
    console.error("Update error:", error);
    alert("An error occurred while updating the expense.");
  }
}

function createTableRow(expense) {
  const row = document.createElement("tr");
  const formattedDate = new Date(expense.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  row.innerHTML = `
        <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">${formattedDate}</td>
        <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">${expense.description}</td>
        <td class="whitespace-nowrap px-6 py-4">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">${expense.category || "Uncategorized"}</span>
        </td>
        <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-red-500">-$${expense.amount.toFixed(2)}</td>
        <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
            <button class="edit-button text-primary hover:text-primary/80" data-expense-id="${expense.id}">Edit</button>
        </td>
    `;
  return row;
}

function showEmptyMessage(tableBody) {
  tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">No transactions found.</td></tr>`;
}

function showErrorMessage(tableBody) {
  tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">Could not load transactions. Please try again later.</td></tr>`;
}
