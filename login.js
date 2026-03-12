import finduserbymail from "./database.js";

// Toggle password visibility
const initPasswordToggle = (callback) => {
  const displayBtn = document.getElementById("display");
  const passwordInput = document.getElementById("password");

  displayBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      displayBtn.textContent = "🙈";
    } else {
      passwordInput.type = "password";
      displayBtn.textContent = "👁";
    }
  });

  callback();
};

// Valider les champs
const validateInputs = (mail, password, callback) => {
  const errorDiv = document.getElementById("error");

  if (!mail || !password) {
    errorDiv.innerHTML = `<p style="color:red;">Veuillez remplir tous les champs.</p>`;
    return;
  }

  callback(mail, password);
};

// Chercher l'utilisateur
const authenticateUser = (mail, password, callback) => {
  const user = finduserbymail(mail, password);

  if (user) {
    callback(user);
  } else {
    const errorDiv = document.getElementById("error");
    errorDiv.innerHTML = `<p style="color:red;">Email ou mot de passe incorrect.</p>`;
  }
};

// Sauvegarder et rediriger
const saveAndRedirect = (user) => {
  localStorage.setItem("currentUser", JSON.stringify(user));
  window.location.href = "dashboard.html";
};

// Initialisation avec callbacks imbriqués
initPasswordToggle(() => {
  const submitBtn = document.getElementById("submitbtn");

  submitBtn.addEventListener("click", () => {
    const mail = document.getElementById("mail").value.trim();
    const password = document.getElementById("password").value.trim();

    validateInputs(mail, password, (validMail, validPassword) => {
      authenticateUser(validMail, validPassword, (user) => {
        saveAndRedirect(user);
      });
    });
  });
});