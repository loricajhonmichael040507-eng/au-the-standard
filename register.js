
const registerForm = document.getElementById("register-form");
const registerMessage = document.getElementById("register-message");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fullName = document.getElementById("full-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!fullName || !email || password.length < 8) {
    registerMessage.textContent =
      "Please complete all fields and use a password with at least 8 characters.";
    return;
  }

  const submitButton = registerForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  submitButton.textContent = "CREATING ACCOUNT...";
  registerMessage.textContent = "Please wait...";

  try {
   const { data, error } = await supabaseClient.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: "http://127.0.0.1:5500/index.html",
    data: {
      full_name: fullName
    }
  }
});

    if (error) throw error;

    if (data.session) {
      registerMessage.textContent =
        "Account created successfully! Your account currently has reader access.";
    } else {
      registerMessage.textContent =
        "Registration submitted! Please check your email for a confirmation link if required.";
    }

    registerForm.reset();

  } catch (error) {
    console.error("Registration error:", error);

    registerMessage.textContent =
      error.message || "Registration failed. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "CREATE ACCOUNT";
  }
});
