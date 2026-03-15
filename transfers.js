import { database, sauvegarderDatabase } from "./database.js";

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
  window.location.href = "login.html";
}

const loadBeneficiaires = () => {
  const select = document.getElementById("beneficiary");
  if (!select) return;

  select.innerHTML = `<option value="" disabled selected>Choisir un bénéficiaire</option>`;

  const autresUsers = database.users.filter(u => u.id !== currentUser.id);

  if (autresUsers.length === 0) {
    select.innerHTML += `<option disabled>Aucun utilisateur disponible</option>`;
    return;
  }

  autresUsers.forEach(user => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.name;
    select.appendChild(option);
  });
};

const loadCartes = () => {
  const select = document.getElementById("sourceCard");
  if (!select) return;

  select.innerHTML = `<option value="" disabled selected>Sélectionner une carte</option>`;

  const userInDB = database.users.find(u => u.id === currentUser.id);

  if (!userInDB || userInDB.wallet.cards.length === 0) {
    select.innerHTML += `<option disabled>Aucune carte disponible</option>`;
    return;
  }

  userInDB.wallet.cards.forEach(card => {
    const option = document.createElement("option");
    option.value = card.numcards;
    const type = card.type.charAt(0).toUpperCase() + card.type.slice(1);
    option.textContent = `${type} - ${card.numcards}`;
    select.appendChild(option);
  });
};

loadBeneficiaires();
loadCartes();

document.querySelectorAll(".sidebar-nav a").forEach(link => {
  link.addEventListener("click", () => {
    if (link.getAttribute("href")?.substring(1) === "transfers") {
      loadBeneficiaires();
      loadCartes();
    }
  });
});

const checkAmount = (amount, callback) => {
  if (!amount || isNaN(amount) || amount <= 0) {
    showError(" Montant invalide. Veuillez entrer un montant positif.");
    return;
  }
  callback(amount);
};

const checkSolde = (amount, currentUser, callback) => {
  showInfo("⏳ Vérification du solde...");
  setTimeout(() => {
    const userInDB = database.users.find(u => u.id === currentUser.id);
    if (userInDB.wallet.balance < amount) {
      showError(` Solde insuffisant. Votre solde : ${userInDB.wallet.balance} MAD`);
      return;
    }
    callback(amount, userInDB);
  }, 1000);
};

const checkBeneficiaire = (beneficiaireId, amount, currentUser, callback) => {
  showInfo("⏳ Vérification du bénéficiaire...");
  setTimeout(() => {
    const beneficiaire = database.users.find(u => String(u.id) === String(beneficiaireId));
    if (!beneficiaire) {
      showError("❌ Bénéficiaire introuvable.");
      return;
    }
    if (String(beneficiaire.id) === String(currentUser.id)) {
      showError("❌ Vous ne pouvez pas vous envoyer de l'argent à vous-même.");
      return;
    }
    callback(amount, currentUser, beneficiaire);
  }, 800);
};

const createTransaction = (amount, currentUser, beneficiaire, callback) => {
  showInfo("⏳ Création de la transaction...");
  setTimeout(() => {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2,"0")}-${(now.getMonth()+1).toString().padStart(2,"0")}-${now.getFullYear()}`;
    const newId = String(Date.now());

    const transactionDebit = {
      id: newId + "-d",
      type: "debit",
      amount: amount,
      date: dateStr,
      from: currentUser.wallet.cards[0]?.numcards || "wallet",
      to: beneficiaire.name
    };

    const transactionCredit = {
      id: newId + "-c",
      type: "credit",
      amount: amount,
      date: dateStr,
      from: currentUser.name,
      to: beneficiaire.wallet.cards[0]?.numcards || "wallet"
    };

    callback(amount, currentUser, beneficiaire, transactionDebit, transactionCredit);
  }, 800);
};

const debitCredit = (amount, currentUser, beneficiaire, transactionDebit, transactionCredit, callback) => {
  showInfo("⏳ Traitement du transfert...");
  setTimeout(() => {
    const sender = database.users.find(u => u.id === currentUser.id);
    sender.wallet.balance -= amount;
    sender.wallet.transactions.unshift(transactionDebit);

    const receiver = database.users.find(u => String(u.id) === String(beneficiaire.id));
    receiver.wallet.balance += amount;
    receiver.wallet.transactions.unshift(transactionCredit);

    sauvegarderDatabase();
    localStorage.setItem("currentUser", JSON.stringify(sender));

    callback(amount, beneficiaire, sender);
  }, 1000);
};

const showError = (message) => {
  const div = document.getElementById("transferStatus");
  if (div) div.innerHTML = `<p style="color:red; font-weight:600;">${message}</p>`;
};

const showInfo = (message) => {
  const div = document.getElementById("transferStatus");
  if (div) div.innerHTML = `<p style="color:#3b66f6;">${message}</p>`;
};

const showSuccess = (amount, beneficiaire, sender) => {
  const div = document.getElementById("transferStatus");
  if (div) {
    div.innerHTML = `
      <p style="color:green; font-weight:600;">
        ✅ Transfert de ${amount} MAD à ${beneficiaire.name} effectué avec succès !<br>
        Nouveau solde : ${sender.wallet.balance} MAD
      </p>`;
  }
  document.getElementById("amount").value = "";
  document.getElementById("beneficiary").value = "";
  document.getElementById("sourceCard").value = "";
};

const lancerTransfert = (amount, beneficiaireId, currentUser) => {
  checkAmount(amount, (validAmount) => {
    checkSolde(validAmount, currentUser, (validAmount, userInDB) => {
      checkBeneficiaire(beneficiaireId, validAmount, userInDB, (validAmount, sender, beneficiaire) => {
        createTransaction(validAmount, sender, beneficiaire, (validAmount, sender, beneficiaire, txDebit, txCredit) => {
          debitCredit(validAmount, sender, beneficiaire, txDebit, txCredit, (amount, beneficiaire, updatedSender) => {
            showSuccess(amount, beneficiaire, updatedSender);
          });
        });
      });
    });
  });
};

document.getElementById("submitTransferBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("amount").value);
  const beneficiaireId = document.getElementById("beneficiary").value;

  if (!beneficiaireId) {
    showError("❌ Veuillez choisir un bénéficiaire.");
    return;
  }

  const freshUser = JSON.parse(localStorage.getItem("currentUser"));
  lancerTransfert(amount, beneficiaireId, freshUser);
});

document.getElementById("cancelTransferBtn")?.addEventListener("click", () => {
  document.getElementById("transferForm")?.reset();
  document.getElementById("transferStatus").innerHTML = "";
});