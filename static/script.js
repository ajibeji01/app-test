
let loggedInUser = "";

function logout() {
    dashboard()

    document.getElementById("login_block").style.display = "block";

    document.getElementById("balance_block").style.display = "none";
    document.getElementById("action_block").style.display = "none";
    document.getElementById("logout_block").style.display = "none";

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";

    document.getElementById("loginResult").innerText  = "";

    loggedInUser = "";
}

function dashboard() {
    document.getElementById("login_block").style.display = "none";

    document.getElementById("gamble_block").style.display = "none";
    document.getElementById("codes_block").style.display = "none";
    document.getElementById("transfer_block").style.display = "none";
    document.getElementById("marketplace").style.display = "none";

    document.getElementById("balance_block").style.display = "block";
    document.getElementById("action_block").style.display = "block";


    document.getElementById("logout_block").style.display = "block";
}

function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            document.getElementById("loginResult").innerText = data.error;
        } else {
            loggedInUser = username;
            dashboard()
            document.getElementById("welcome").innerText = "Welcome back, " + loggedInUser;
            document.getElementById("balance").innerText = "Balance: F$" + data.Feinbucks;
        }
    });
}

function signup() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            document.getElementById("loginResult").innerText = data.error;
        }
    });
}

function getBalance() {
    if (!loggedInUser) {
        alert("Please log in first!");
        return;
    }

    fetch(`/balance/${loggedInUser}`)
    .then(res => res.json())
    .then(data => document.getElementById("balance").innerText = "Balance: F$" + data.Feinbucks);
}

function gamble() {
    if (!loggedInUser) {
        alert("Please log in first!");
        return;
    }

    let bet = document.getElementById("bet").value;
    fetch(`/gamble/${loggedInUser}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            document.getElementById("gambleResult").innerText = data.error;
            document.getElementById("gambleResult").style.color = "rgb(200,0,0)";
        } else {
            document.getElementById("gambleResult").innerText = "You won: F$" + data.winnings;
            document.getElementById("gambleResult").style.color = "rgb(0,0,0)";
            getBalance();
        }
    });
}

function claimCode() {
        if (!loggedInUser) {
        alert("Please log in first!");
        return;
    }

    let code = document.getElementById("code").value;

    fetch(`/claimCode/${loggedInUser}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            document.getElementById("codeResult").innerText = data.error;
            document.getElementById("codeResult").style.color = "rgb(200,0,0)";
        } else {
            document.getElementById("codeResult").innerText = "Code claimed +F$" + data.winnings;
            document.getElementById("codeResult").style.color = "rgb(0,0,0)";
            getBalance();
        }
    });
}

function transfer() {
        if (!loggedInUser) {
        alert("Please log in first!");
        return;
    }

    let amount = document.getElementById("transferAmount").value;
    let recipient = document.getElementById("recipient").value;

    fetch(`/transfer/${loggedInUser}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, recipient })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            document.getElementById("transferResult").innerText = data.error;
            document.getElementById("transferResult").style.color = "rgb(200,0,0)";
        } else {
            document.getElementById("transferResult").innerText = "Successfully transfered feinbucks";
            document.getElementById("transferResult").style.color = "rgb(0,0,0)";
            getBalance();
        }
    });
}

function loadMarketplace() {


    fetch(`/marketplace/${loggedInUser}`)
    .then(res => res.json())
    .then(data => {
        // Populate owned limiteds
        const ownedTable = document.getElementById("owned-limiteds");
        ownedTable.innerHTML = "";

        for (const [limited, details] of Object.entries(data.owned)) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${limited}</td>
                <td>#${details.copy}</td>
                <td>${details.market ? `F$${details.market}` : "Not for sale"}</td>
                <td>
                    <input type="number" id="sell-price-${limited}" placeholder="Enter price">
                    <button onclick="sellLimited('${limited}')">Sell</button>
                </td>
            `;
            ownedTable.appendChild(row);
        }
    });

        // Populate marketplace limiteds
        const marketTable = document.getElementById("marketplace-list");
        marketTable.innerHTML = "";

        for (const [limited, sales] of Object.entries(data.market)) {
            sales.forEach(sale => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${limited}</td>
                    <td>${sale.seller}</td>
                    <td>F$${sale.price}</td>
                    <td><button onclick="buyLimited('${limited}', '${sale.seller}', ${sale.price})">Buy</button></td>
                `;
                marketTable.appendChild(row);
            });
        }
    }

async function sellLimited(limitedName) {
    const price = document.getElementById(`sell-price-${limitedName}`).value;

    if (!price || isNaN(price) || price <= 0) {
        alert("Enter a valid price!");
        return;
    }

    const response = await fetch("/sell_limited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loggedInUser, limited: limitedName, price })
    });

    const data = await response.json();
    if (data.success) {
        alert("Limited listed for sale!");
        loadMarketplace();
    } else {
        alert("Error: " + data.error);
    }
}

async function buyLimited(limitedName, seller, price) {
    const response = await fetch("/buy_limited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loggedInUser, limited: limitedName, seller, price })
    });

    const data = await response.json();
    if (data.success) {
        alert("Limited bought successfully!");
        loadMarketplace();
    } else {
        alert("Error: " + data.error);
    }
}

function gambleUI() {
    if (!loggedInUser) {
        alert("Please log in first!");
        return;
    }
    dashboard()
    document.getElementById("gamble_block").style.display = "block";
}

function codesUI() {
    if (!loggedInUser) {
        alert("Please log in first!");
        return;
    }
    dashboard()
    document.getElementById("codes_block").style.display = "block";
}

function transferUI() {
    if (!loggedInUser) {
        alert("Please log in first!");
        return;
    }
    dashboard()
    document.getElementById("transfer_block").style.display = "block";
}

function limitedsUI() {
    if (!loggedInUser) {
        alert("Please log in first!");
        return;
    }
    dashboard()
    document.getElementById("marketplace").style.display = "block";
    loadMarketplace()
}
