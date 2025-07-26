document.getElementById("signupForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    fetch("http://localhost:8080/api/users/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password,
            role,
        }),
    })
        .then((res) => {
            if (!res.ok) {
                return res.text().then(text => { throw new Error(text); });
            }
            return res.text();
        })
        .then((message) => {
            alert(message);
            window.location.href = "login.html";
        })
        .catch((err) => {
            alert("Signup failed: " + err.message);
        });
});
