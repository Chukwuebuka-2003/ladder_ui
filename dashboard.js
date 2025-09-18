// Base URL for the FastAPI backend
const API_URL = "https://ladder-ai.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    window.location.href = "login.html";
    return;
  }

  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    });
  }

  fetchAllDashboardData(authToken);
});

/**
 * Fetches all necessary data for the dashboard from multiple endpoints concurrently.
 * @param {string} token - The user's authentication token.
 */
async function fetchAllDashboardData(token) {
  const insightsContainer = document.getElementById("category-chart-container");
  const budgetContainer = document.getElementById("budget-overview-container");
  const trendsContainer = document.getElementById(
    "monthly-trends-chart-container",
  );

  // Set loading states
  insightsContainer.innerHTML =
    "<p class='text-center text-gray-500'>Loading chart...</p>";
  budgetContainer.innerHTML =
    "<p class='text-center text-gray-500'>Loading budgets...</p>";
  trendsContainer.innerHTML =
    "<p class='text-center text-gray-500'>Loading trends...</p>";

  try {
    const [insightsResponse, budgetsResponse, trendsResponse] =
      await Promise.all([
        fetchApiData(token, `${API_URL}/ai/insights`, {
          method: "POST",
          body: JSON.stringify({
            start_date: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            end_date: new Date().toISOString(),
            ai_provider: "gemini",
          }),
        }),
        fetchApiData(token, `${API_URL}/budgets/`),
        fetchApiData(token, `${API_URL}/trends/monthly`),
      ]);

    updateCategoryChart(insightsContainer, insightsResponse.top_categories);
    updateBudgetOverview(
      budgetContainer,
      insightsResponse.total_spent,
      budgetsResponse,
      insightsResponse.top_categories,
    );
    updateMonthlyTrendChart(trendsContainer, trendsResponse.data);
  } catch (error) {
    console.error("Dashboard error:", error);
    if (error.message.includes("401")) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    } else {
      insightsContainer.innerHTML =
        "<p class='text-center text-red-500 col-span-full'>Could not load insight data.</p>";
      budgetContainer.innerHTML =
        "<p class='text-center text-red-500'>Could not load budget data.</p>";
      trendsContainer.innerHTML =
        "<p class='text-center text-red-500'>Could not load trend data.</p>";
    }
  }
}

/**
 * A robust, reusable function for fetching data from the API.
 * @param {string} token - The user's authentication token.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Optional fetch options (method, body, etc.).
 * @returns {Promise<any>} The JSON response from the API.
 */
async function fetchApiData(token, url, options = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  return null;
}

function updateCategoryChart(container, categories) {
  container.innerHTML = "";
  if (!categories || categories.length === 0) {
    container.innerHTML =
      "<p class='col-span-full text-center text-gray-500'>No spending data for chart.</p>";
    return;
  }
  const maxAmount = Math.max(...categories.map((c) => c.amount), 0);
  categories.forEach((category) => {
    const barHeight = maxAmount > 0 ? (category.amount / maxAmount) * 100 : 0;
    const barElement = document.createElement("div");
    barElement.className = "flex flex-col items-center h-full";
    barElement.innerHTML = `
            <div class="w-full flex-1 flex items-end">
                <div class="w-3/4 mx-auto bg-primary/20 dark:bg-primary/30 rounded-t-md" style="height: ${barHeight}%"></div>
            </div>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 truncate pt-2">${category.category}</p>
        `;
    container.appendChild(barElement);
  });
}

function updateBudgetOverview(container, totalSpent, budgets, categories) {
  container.innerHTML = "";
  const budgetMap = new Map(budgets.map((b) => [b.category, b.amount]));
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

  if (totalBudget > 0) {
    const totalData = {
      name: "Total Budget",
      spent: totalSpent,
      total: totalBudget,
    };
    container.appendChild(createBudgetProgressBar(totalData));
  }

  categories.forEach((cat) => {
    if (budgetMap.has(cat.category)) {
      const budgetData = {
        name: cat.category,
        spent: cat.amount,
        total: budgetMap.get(cat.category),
      };
      container.appendChild(createBudgetProgressBar(budgetData));
    }
  });

  if (container.innerHTML === "") {
    container.innerHTML =
      "<p class='text-center text-gray-500'>No budgets set. Go to the Budgets page to create one.</p>";
  }
}

/**
 * Renders the "Monthly Trends" bar chart.
 * @param {HTMLElement} container - The container for the chart.
 * @param {Array<object>} trendData - The monthly trend data.
 */
function updateMonthlyTrendChart(container, trendData) {
  container.innerHTML = "";
  // Added a more robust check for valid data
  if (!trendData || !Array.isArray(trendData) || trendData.length === 0) {
    container.innerHTML =
      "<p class='text-center text-gray-500'>Not enough data for a monthly trend chart.</p>";
    return;
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const maxAmount = Math.max(...trendData.map((d) => d.total_spent), 0);

  trendData.forEach((dataPoint) => {
    const barHeight =
      maxAmount > 0 ? (dataPoint.total_spent / maxAmount) * 100 : 0;
    const barElement = document.createElement("div");
    // Updated the flexbox classes to ensure vertical alignment
    barElement.className =
      "flex-1 flex flex-col items-center justify-end h-full";
    barElement.innerHTML = `
            <div class="w-1/2 bg-primary/20 dark:bg-primary/30 rounded-t-md" style="height: ${barHeight}%"></div>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 pt-2">${monthNames[dataPoint.month - 1]}</p>
        `;
    container.appendChild(barElement);
  });
}

function createBudgetProgressBar(data) {
  const percentage = data.total > 0 ? (data.spent / data.total) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);
  const element = document.createElement("div");
  element.innerHTML = `
        <div class="flex justify-between items-baseline mb-1">
            <p class="font-semibold text-slate-800 dark:text-slate-200">${data.name}</p>
            <p class="text-sm font-bold text-primary">${clampedPercentage.toFixed(0)}%</p>
        </div>
        <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5">
            <div class="bg-primary h-2.5 rounded-full" style="width: ${clampedPercentage}%"></div>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 text-right">
            $${data.spent.toFixed(2)} / $${data.total.toFixed(2)}
        </p>
    `;
  return element;
}
