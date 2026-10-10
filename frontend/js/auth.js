const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        // Check fields
        if (!name || !email || !password || !confirmPassword) {
            alert("Please fill all fields.");
            return;
        }

        // Check password match
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            console.log("Sending registration request...");

            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password
                    })
                }
            );

            console.log("Response received:", response.status);

            const data = await response.json();

            console.log("Server response:", data);

            if (data.success) {
                alert("Registration successful!");

                window.location.href = "login.html";
            } else {
                alert(data.message);
            }

        } catch (error) {
            console.error("Registration error:", error);

            alert(
                "Unable to connect to server. Check browser console."
            );
        }
    });
}
// =========================
// LOGIN USER
// =========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        try {
            console.log("Sending login request...");

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            console.log("Response received:", response.status);

            const data = await response.json();

            console.log("Server response:", data);

            if (data.success) {

                // Save JWT token
                localStorage.setItem("token", data.token);

                // Save user information
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                alert("Login successful!");

                // Go to dashboard
                window.location.href = "dashboard.html";

            } else {
                alert(data.message);
            }

        } catch (error) {
            console.error("Login error:", error);
            alert("Unable to connect to server.");
        }
    });
}