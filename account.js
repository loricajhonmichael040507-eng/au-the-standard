
const accountForm = document.querySelector("#account-form");
const registerButton = document.querySelector("#register-button");
const accountMessage = document.querySelector("#account-message");

function showAccountMessage(message, isError = false) {
  accountMessage.textContent = message;
  accountMessage.style.color = isError ? "#b42318" : "#087c78";
}

function getAccountFields() {
  return {
    email: document.querySelector("#account-email").value.trim(),
    password: document.querySelector("#account-password").value
  };
}

// REGISTER
registerButton.addEventListener("click", async () => {
  const { email, password } = getAccountFields();

  if (!email || password.length < 8) {
    showAccountMessage(
      "Enter a valid email and a password with at least 8 characters.",
      true
    );
    return;
  }

  registerButton.disabled = true;
  showAccountMessage("Creating your account...");

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    // With email confirmation enabled, a session may not exist yet.
    // The profile is created after the user signs in for the first time.
    if (!data.session) {
      showAccountMessage(
        "Registration received! Check your email to confirm your account. After confirmation, log in to finish setting up your reader profile."
      );
    } else {
      await ensureReaderProfile(data.user.id);
      showAccountMessage(
        "Account created! Your reader profile is pending approval."
      );
    }
  } catch (error) {
    showAccountMessage(error.message || "Registration failed.", true);
  } finally {
    registerButton.disabled = false;
  }
});

// CREATE A DEFAULT READER PROFILE
async function ensureReaderProfile(userId) {
  const { data: existingProfile, error: readError } = await supabaseClient
    .from("profiles")
    .select("user_id, role, approval_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw readError;

  if (existingProfile) return existingProfile;

  const { data, error } = await supabaseClient
    .from("profiles")
    .insert({
      user_id: userId,
      role: "reader",
      approval_status: "pending"
    })
    .select("user_id, role, approval_status")
    .single();

  if (error) throw error;

  return data;
}

// LOG IN
accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const { email, password } = getAccountFields();

  showAccountMessage("Signing in...");

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const profile = await ensureReaderProfile(data.user.id);

    if (profile.role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    if (profile.approval_status === "pending") {
      showAccountMessage(
        "You're signed in, but your membership is still pending approval."
      );
      return;
    }

    if (profile.approval_status === "rejected") {
      showAccountMessage(
        "Your membership request was not approved. Please contact the publication team."
      );
      return;
    }

    showAccountMessage("You're signed in successfully!");
  } catch (error) {
    showAccountMessage(
      error.message || "Login failed. Please try again.",
      true
    );
  }
});
