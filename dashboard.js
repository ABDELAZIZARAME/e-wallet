import { database } from "./database.js";

const checkSession = (callback) => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) { window.location.href = "login.html"; return; }
  callback(currentUser);
};

const loadUserData = (currentUser, callback) => {
  setTimeout(() => {
    const userInDB = database.users.find(u => u.id === currentUser.id);
    if (!userInDB) { console.error(" Utilisateur introuvable."); return; }
    callback(userInDB);
  }, 500);
};

const renderHeader = (user, callback) => {
  document.getElementById("greetingName").textContent = user.name;
  const now = new Date();
  document.getElementById("currentDate").textContent = now.toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  callback(user);
};

const renderSummaryCards = (user, callback) => {
  const wallet = user.wallet;
  document.getElementById("availableBalance").textContent = wallet.balance.toLocaleString("fr-FR") + " " + wallet.currency;
  const revenus = wallet.transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  document.getElementById("monthlyIncome").textContent = revenus.toLocaleString("fr-FR") + " " + wallet.currency;
  const depenses = wallet.transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
  document.getElementById("monthlyExpenses").textContent = depenses.toLocaleString("fr-FR") + " " + wallet.currency;
  document.getElementById("activeCards").textContent = wallet.cards.length;
  callback(user);
};

const renderTransactions = (user, callback) => {
  const list = document.getElementById("recentTransactionsList");
  list.innerHTML = "";
  if (user.wallet.transactions.length === 0) {
    list.innerHTML = `<p style="color:#aaa;">Aucune transaction.</p>`;
  } else {
    user.wallet.transactions.forEach(t => {
      const isCredit = t.type === "credit";
      list.innerHTML += `
        <div class="transaction-item">
          <div class="transaction-icon ${isCredit ? "green" : "red"}">
            <i class="fas fa-arrow-${isCredit ? "down" : "up"}"></i>
          </div>
          <div class="transaction-details">
            <span class="transaction-name">${isCredit ? t.from : t.to}</span>
            <span class="transaction-date">${t.date}</span>
          </div>
          <span class="transaction-amount ${isCredit ? "positive" : "negative"}">
            ${isCredit ? "+" : "-"}${t.amount} ${user.wallet.currency}
          </span>
        </div>`;
    });
  }
  callback(user);
};

const renderCards = (user, callback) => {
  const grid = document.getElementById("cardsGrid");
  grid.innerHTML = "";
  user.wallet.cards.forEach(card => {
    grid.innerHTML += `
      <div class="card-item">
        <div class="card-preview ${card.type}">
          <div class="card-chip"></div>
          <div class="card-number">**** **** **** ${card.numcards.slice(-4)}</div>
          <div class="card-holder">${user.name}</div>
          <div class="card-expiry">${card.expiry}</div>
          <div class="card-type">${card.type.toUpperCase()}</div>
        </div>
        <div class="card-actions">
          <button class="card-action" title="Définir par défaut"><i class="fas fa-star"></i></button>
          <button class="card-action" title="Geler la carte"><i class="fas fa-snowflake"></i></button>
          <button class="card-action" title="Supprimer"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
  });
  callback(user);
};

const renderAllTransactions = (user, callback) => {
  const list = document.getElementById("allTransactionsList");
  if (!list) { callback(user); return; }
  list.innerHTML = "";
  if (user.wallet.transactions.length === 0) {
    list.innerHTML = `<p style="color:#aaa;">Aucune transaction.</p>`;
  } else {
    user.wallet.transactions.forEach(t => {
      const isCredit = t.type === "credit";
      list.innerHTML += `
        <div class="transaction-item">
          <div class="transaction-icon ${isCredit ? "green" : "red"}">
            <i class="fas fa-arrow-${isCredit ? "down" : "up"}"></i>
          </div>
          <div class="transaction-details">
            <span class="transaction-name">${isCredit ? t.from : t.to}</span>
            <span class="transaction-date">${t.date}</span>
          </div>
          <span class="transaction-amount ${isCredit ? "positive" : "negative"}">
            ${isCredit ? "+" : "-"}${t.amount} ${user.wallet.currency}
          </span>
        </div>`;
    });
  }
  callback(user);
};

const navigateTo = (sectionId) => {
  document.querySelectorAll(".dashboard-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".sidebar-nav li").forEach(l => l.classList.remove("active"));
  const section = document.getElementById(sectionId);
  if (section) section.classList.add("active");
  const link = document.querySelector(`.sidebar-nav a[href="#${sectionId}"]`);
  if (link) link.parentElement.classList.add("active");
};

const initNavigation = (user, callback) => {
  // Barre de navigation gauche
  document.querySelectorAll(".sidebar-nav a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(link.getAttribute("href").substring(1));
    });
  });

  
  document.getElementById("quickTransfer")?.addEventListener("click", () => navigateTo("transfers"));

  

  callback(user);
};

checkSession((currentUser) => {
  loadUserData(currentUser, (userInDB) => {
    renderHeader(userInDB, (user) => {
      renderSummaryCards(user, (user) => {
        renderTransactions(user, (user) => {
          renderCards(user, (user) => {
            renderAllTransactions(user, (user) => {
              initNavigation(user, (user) => {
                console.log("🎉 Dashboard prêt !");
              });
            });
          });
        });
      });
    });
  });
});