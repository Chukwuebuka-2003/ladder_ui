// Base URL for the FastAPI backend
const API_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
  // Authentication Check
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "login.html";
    return;
  }

  // Element References
  const budgetListContainer = document.getElementById("budget-list-container");
  const createBudgetButton = document.getElementById("create-budget-button");
  const budgetModal = document.getElementById("budget-modal");
  const budgetForm = document.getElementById("budget-form");
  const closeModalButton = document.getElementById("close-modal-button");

  // Initial Data Load
  fetchAndDisplayBudgets(authToken, budgetListContainer);

  // Event Listeners
  createBudgetButton.addEventListener("click", () => {
    budgetModal.classList.remove("hidden"); // Show the modal
  });

  closeModalButton.addEventListener("click", () => {
    budgetModal.classList.add("hidden"); // Hide the modal
  });

  budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleCreateBudget(authToken, budgetForm, budgetListContainer);
    budgetModal.classList.add("hidden"); // Hide modal on success
  });
});

/**
 * Fetches the user's budgets from the API and displays them.
 * @param {string} token - The user's authentication token.
 * @param {HTMLElement} container - The container to display the budgets in.
 */
async function fetchAndDisplayBudgets(token, container) {
  container.innerHTML =
    "<p class='text-center text-gray-500 py-4'>Loading budgets...</p>";

  try {
    const response = await fetch(`${API_URL}/budgets`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) window.location.href = "login.html";
      throw new Error("Failed to fetch budgets");
    }

    const budgets = await response.json();
    container.innerHTML = "";

    if (budgets.length === 0) {
      container.innerHTML =
        "<p class='text-center text-gray-500 py-4'>No custom budgets created yet.</p>";
    } else {
      budgets.forEach((budget) => {
        const budgetElement = createBudgetElement(budget);
        container.appendChild(budgetElement);
      });
    }
  } catch (error) {
    console.error("Error fetching budgets:", error);
    container.innerHTML =
      "<p class='text-center text-red-500 py-4'>Could not load budgets.</p>";
  }
}

/**
 * Handles the submission of the "Create Budget" form.
 * @param {string} token - The user's authentication token.
 * @param {HTMLFormElement} form - The form element.
 * @param {HTMLElement} container - The budget list container to refresh.
 */
async function handleCreateBudget(token, form, container) {
  const formData = new FormData(form);
  const budgetData = {
    category: formData.get("category"),
    amount: parseFloat(formData.get("amount")),
    start_date: new Date().toISOString(), // Default start date to now
    end_date: new Date(formData.get("end_date")).toISOString(),
  };

  try {
    const response = await fetch(`${API_URL}/budgets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
    });

    if (response.status === 201) {
      alert("Budget created successfully!");
      form.reset();
      fetchAndDisplayBudgets(token, container); // Refresh the list
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.detail || "Could not create budget."}`);
    }
  } catch (error) {
    console.error("Error creating budget:", error);
    alert("An error occurred while creating the budget.");
  }
}

/**
 * Creates an HTML element for a single budget item.
 * @param {object} budget - The budget data object.
 * @returns {HTMLElement} The created budget element.
 */
function createBudgetElement(budget) {
  const element = document.createElement("div");
  element.className =
    "flex items-center justify-between gap-4 py-4 px-4 hover:bg-gray-50 dark:hover:bg-background-dark/50";

  // Simple icon placeholder
  element.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                <!-- Generic Icon -->
                <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M224,88a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,88Zm-8,64H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>
                </svg>
            </div>
            <div>
                <p class="text-base font-medium text-gray-900 dark:text-white">${budget.category}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Ends on ${new Date(budget.end_date).toLocaleDateString()}
                </p>
            </div>
        </div>
        <div class="text-base font-medium text-gray-800 dark:text-gray-200">
            $${budget.amount.toFixed(2)}
        </div>
    `;
  return element;
}
