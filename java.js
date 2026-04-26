let selectedCategory = "All";
// ================= BASIC PAGE SWITCH =================

function showPage(page) {

    const protectedPages = ["post", "requests", "accepted"];

    if (protectedPages.includes(page)) {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            showToast("Please login first", true);
            return;
        }
    }

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("page-" + page).classList.add("active");

    // ✅ THIS SHOULD BE HERE (outside)
    if (page === "browse") {
        loadTasks();
        updateCollegeLabel();
    }
    if (page === "requests") {
    loadMyRequests();
}
if (page === "accepted") {
    loadMyWork();
}

    checkUser();
}
// ================= Register User  =================
async function registerUser() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const university = document.getElementById("reg-university").value.toLowerCase();
    const roll = document.getElementById("reg-roll").value;
    const dept = document.getElementById("reg-dept").value;
    const phone = document.getElementById("reg-phone").value;

    if (!name || !email || !password || !university || !roll || !dept || !phone) {
        showToast("Please fill all fields");
        return;
    }

    const { collection, addDoc } = firebaseFns;

    const docRef = await addDoc(collection(db, "users"), {
        name,
        email,
        password, // ⚠️ for demo only (not secure)
        university: university.toLowerCase(),
        roll,
        dept,
        phone,
         acceptedCount: 0,
        isPro: false, 
        createdAt: new Date()
    });

    // store locally
    localStorage.setItem("userId", docRef.id);
    localStorage.setItem("userName", name);
    localStorage.setItem("userRoll", roll);
    localStorage.setItem("userPhone", phone);
    localStorage.setItem("userUniversity", university.toLowerCase());
    checkUser();

    
    showPage("home");
    setTimeout(() => {
    showToast("Registered successfully!");
}, 100);
}
// ================= Login =================
async function loginUser() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const { collection, getDocs } = firebaseFns;

    const snapshot = await getDocs(collection(db, "users"));

    let found = false;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        if (data.email === email && data.password === password) {
            localStorage.setItem("userId", docSnap.id);
            localStorage.setItem("userName", data.name);
            localStorage.setItem("userRoll", data.roll);
            localStorage.setItem("userUniversity", data.university);
            localStorage.setItem("userPhone", data.phone); // 🔥 RESET
            found = true;
            break; // ✅ stop loop
        }
    }

   if (found) {
    showPage("home");

    setTimeout(() => {
        showToast("Login successful!");
        checkUser();
    }, 100);

} else {
    showToast("Invalid email or password", true);
}
}
// ================= check if logged in  =================
function checkUser() {
    const userId = localStorage.getItem("userId");

    console.log("checkUser running, userId:", userId); // 🔥 debug

    const loginBtns = document.querySelectorAll(".nav-login");
    const registerBtns = document.querySelectorAll(".nav-register");
    const logoutBtns = document.querySelectorAll(".nav-logout");

    console.log("loginBtns:", loginBtns.length); // 🔥 debug

    if (userId) {
        loginBtns.forEach(btn => btn.style.display = "none");
        registerBtns.forEach(btn => btn.style.display = "none");
        logoutBtns.forEach(btn => btn.style.display = "inline-block");
    } else {
        loginBtns.forEach(btn => btn.style.display = "inline-block");
        registerBtns.forEach(btn => btn.style.display = "inline-block");
        logoutBtns.forEach(btn => btn.style.display = "none");
    }
}

// ================= Log out  =================
function logoutUser() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userUniversity");
    localStorage.removeItem("userRoll");

    checkUser();
    showPage("home");

    setTimeout(() => {
        showToast("Logged out");
    }, 100);
}


window.onload = function () {
    checkUser();
};
// ================= toast mssg  =================
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");

    if (!toast) {
        console.log("toast not found");
        return;
    }

    toast.innerText = message;
    toast.style.background = isError ? "#E03A2E" : "#111";

    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 2500);
}

// ================= Login while posting   =================
function handlePostClick() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        showToast("Please login first to post a task", true);

        setTimeout(() => {
            showPage("login");
        }, 800);

        return;
    }

    // if logged in
    showPage("post");
}
// ================= login while browsing  =================

function handleBrowseClick() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        showToast("Please login to browse services", true);

        setTimeout(() => {
            showPage("login");
        }, 800);

        return;
    }

    showPage("browse");
}
// ================= login while seeing requests =================
function handleRequestsClick() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        showToast("Login required to view your requests", true);

        setTimeout(() => {
            showPage("login");
        }, 800);

        return;
    }

    showPage("requests");
}

// ================= login while viewing accepted tasks =================
function handleAcceptedClick() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        showToast("Login required to view your work", true);

        setTimeout(() => {
            showPage("login");
        }, 800);

        return;
    }

    showPage("accepted");
}

// ================= Post task-firebase  =================
async function postTask() {

    const userId = localStorage.getItem("userId");
    const userUniversity = localStorage.getItem("userUniversity");
    const userRoll = localStorage.getItem("userRoll"); // 🔥 important

    if (!userId) {
        showToast("Login required", true);
        return;
    }

    // 🔹 form values
    const name = document.getElementById("f-name").value;
    const email = document.getElementById("f-email").value;
    const phone = document.getElementById("f-phone").value;
    const title = document.getElementById("f-title").value;
    const desc = document.getElementById("f-desc").value;
    const category = document.getElementById("f-category").value;
    const budget = document.getElementById("f-budget").value;

    // 🔹 validation
    if (!name || !email || !phone || !title || !desc || !category) {
        showToast("Please fill all fields", true);
        return;
    }

    try {
        const { collection, addDoc } = firebaseFns;

        await addDoc(collection(db, "tasks"), {
            name,
            email,
            phone,
            title,
            description: desc,
            category,
             budget: budget || "0",
            userId,
            university: userUniversity,
            roll: userRoll || "N/A", // 🔥 added
            status: "open",
            acceptedBy: "",
            acceptedByName: "",
            createdAt: new Date()
        });

        showToast("Task posted successfully!");

        // 🔄 clear form
        document.getElementById("f-name").value = "";
        document.getElementById("f-email").value = "";
        document.getElementById("f-phone").value = "";
        document.getElementById("f-title").value = "";
        document.getElementById("f-desc").value = "";
        document.getElementById("f-category").value = "";

        // 🔄 go to browse
        setTimeout(() => {
            showPage("browse");
        }, 800);

    } catch (err) {
        console.error(err);
        showToast("Error posting task", true);
    }
}

async function loadTasks() {

    const { collection, getDocs, query, where } = firebaseFns;

    const userUniversity = localStorage.getItem("userUniversity");
    const currentUser = localStorage.getItem("userId");
    const searchInput = document.getElementById("search-input");
    const searchText = searchInput ? searchInput.value.toLowerCase() : "";

    const container = document.getElementById("services-grid");
    container.innerHTML = "<p>Loading...</p>";

    const categoryCount = {
        "Study Help": 0,
        "Errands": 0,
        "Transport": 0,
        "Printouts": 0,
        "Food": 0,
        "Tech Help": 0,
        "Creative": 0,
        "Projects": 0,
        "Other": 0
    };

    try {
        let q;

        if (userUniversity) {
            q = query(
                collection(db, "tasks"),
                where("university", "==", userUniversity)
            );
        } else {
            q = collection(db, "tasks");
        }

        const snapshot = await getDocs(q);

        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = "<p>No tasks available</p>";
            updateCategoryCounts(categoryCount, 0);
            return;
        }

        let visibleCount = 0;

        snapshot.forEach(docSnap => {
            const data = docSnap.data();

            // ❌ hide accepted tasks
           if (data.status !== "open") return;

            const title = (data.title || "").toLowerCase();
            const desc = (data.description || "").toLowerCase();
            const cat = data.category || "Other";

            // 🔍 search filter
            const matchesSearch =
                title.includes(searchText) ||
                desc.includes(searchText);

            // 📂 category filter
            const matchesCategory =
                selectedCategory === "All" || cat === selectedCategory;

            if (!matchesSearch || !matchesCategory) return;

            visibleCount++;

            // 🔢 count categories
            if (categoryCount[cat] !== undefined) {
                categoryCount[cat]++;
            }

            // 🔥 UI CARD
            container.innerHTML += `
                <div class="service-card">
                    <div class="service-card-body">

                        <div class="service-cat-badge">
                            ${cat}
                        </div>

                        <h3>${data.title || "No Title"}</h3>

                            <div style="
                             font-weight: 700;
                            color: #2ecc71;
                            margin: 6px 0;
                            ">
                            💰 ₹${data.budget || "0"}
                            </div>

                        <div class="service-card-meta">
                            <div class="avatar">👤</div>
                            <div>
                                <div class="name">${data.name || "User"}</div>
                                <div class="college">${formatUniversity(data.university)}</div>
                            </div>
                        </div>

                        <div class="service-card-footer">

                        ${
    currentUser !== data.userId
    ? `<button class="accept-btn"
        onclick="acceptTask('${docSnap.id}', '${data.userId}', this)">
        🚀 Accept & Earn
      </button>`
    : `<span class="your-task">Your Task</span>`
}
                        </div>

                    </div>
                </div>
            `;
        });

        if (visibleCount === 0) {
            container.innerHTML = "<p>No matching tasks found</p>";
        }

        updateCategoryCounts(categoryCount, visibleCount);

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading tasks</p>";
    }
}

function formatUniversity(uni) {
    if (!uni) return "All campuses";

    return uni.replace(/\b\w/g, c => c.toUpperCase());
}
function updateCollegeLabel() {
    const uni = localStorage.getItem("userUniversity");

    const label = document.getElementById("browse-college-label");

    if (!label) return;

    label.innerText = "Showing tasks from " + formatUniversity(uni);
}
function setFilter(category, btn, fromSidebar = false) {

    selectedCategory = category;

    // remove active from top chips
    document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));

    // remove active from sidebar
    document.querySelectorAll(".sidebar-cat").forEach(b => b.classList.remove("active"));

    if (btn) btn.classList.add("active");

    loadTasks(); // 🔥 reload tasks with filter
}

function updateCategoryCounts(categoryCount, total) {

    document.getElementById("cnt-all").innerText = total;

    document.getElementById("cnt-study").innerText = categoryCount["Study Help"];
    document.getElementById("cnt-errands").innerText = categoryCount["Errands"];
    document.getElementById("cnt-transport").innerText = categoryCount["Transport"];
    document.getElementById("cnt-printouts").innerText = categoryCount["Printouts"];
    document.getElementById("cnt-food").innerText = categoryCount["Food"];
    document.getElementById("cnt-tech").innerText = categoryCount["Tech Help"];
    document.getElementById("cnt-creative").innerText = categoryCount["Creative"];
    document.getElementById("cnt-projects").innerText = categoryCount["Projects"];
}
function filterServices() {
    loadTasks();
}
async function loadMyRequests() {

    const { collection, getDocs, query, where } = firebaseFns;

    const userId = localStorage.getItem("userId");

    const container = document.getElementById("requests-list");
    container.innerHTML = "<p>Loading...</p>";

    try {
        const q = query(
            collection(db, "tasks"),
            where("userId", "==", userId)
        );

        const snapshot = await getDocs(q);

        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = "<p>No requests yet</p>";
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();

           container.innerHTML += `
    <div class="request-card">

        <div class="req-top">
            <h3>${data.title || "No Title"}</h3>
            <span class="status ${data.status || "open"}">
                ${data.status || "open"}
            </span>
        </div>

        <div class="req-meta">
            <span>📂 ${data.category || "General"}</span>
            <span>👤 ${data.name || "You"}</span>
        </div>

        <!-- 🔥 NEW CONTACT INFO -->
        <div class="req-contact">
            <span>📞 ${data.phone || "N/A"}</span>
            <span>🆔 ${data.roll || "N/A"}</span>
        </div>

       ${data.status === "accepted" || data.status === "completed" ? `
    <div class="accepted-user">
        Accepted by: ${data.acceptedByName || "User"}
        <br>
        📞 ${data.acceptedByPhone || "N/A"}
        &nbsp; 🆔 ${data.acceptedByRoll || "N/A"}
    </div>
` : ""}

${data.status === "completed" ? `
    <div class="completed-label">
        ✅ Task Completed
    </div>
` : ""}

       ${data.status === "open" ? `
    <div class="req-actions">
        <button onclick="deleteTask('${docSnap.id}')" class="btn-delete">
            Delete
        </button>
    </div>
` : ""}

    </div>
`;
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading requests</p>";
    }
}
async function deleteTask(taskId) {

    const confirmDelete = confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    try {
        const { doc, deleteDoc } = firebaseFns;

        await deleteDoc(doc(db, "tasks", taskId));

        showToast("Task deleted successfully");

        loadMyRequests(); // refresh
        loadTasks(); // refresh browse also

    } catch (err) {
        console.error(err);
        showToast("Error deleting task", true);
    }
}

async function acceptTask(taskId, ownerId, btn) {

    if (btn) btn.disabled = true;

    const currentUser = localStorage.getItem("userId");

    if (!currentUser) {
        showToast("Login required", true);
        return;
    }

    try {
        const { doc, runTransaction } = firebaseFns;

        await runTransaction(db, async (transaction) => {

            const userRef = doc(db, "users", currentUser);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists()) throw "USER_NOT_FOUND";

            const userData = userSnap.data();
            let acceptedCount = userData.acceptedCount || 0;
            let isPro = userData.isPro || false;

            // 🚨 LIMIT CHECK
            if (!isPro && acceptedCount >= 3) {
                throw "LIMIT_REACHED";
            }

            // 🔹 task check
            const taskRef = doc(db, "tasks", taskId);
            const taskSnap = await transaction.get(taskRef);

            if (!taskSnap.exists()) throw "TASK_NOT_FOUND";

            if (taskSnap.data().status !== "open") {
                throw "TASK_TAKEN";
            }

            // 🔹 update task
            transaction.update(taskRef, {
                status: "accepted",
                acceptedBy: currentUser
            });

            // 🔹 update user count
            transaction.update(userRef, {
                acceptedCount: acceptedCount + 1
            });
        });

        showToast("Task accepted!");
        loadTasks();
        loadMyWork();
        loadMyRequests();

    } catch (err) {

        if (btn) btn.disabled = false;

        if (err === "LIMIT_REACHED") {
            showSubscriptionPopup();
        } else if (err === "TASK_TAKEN") {
            showToast("Task already taken", true);
        } else {
            console.error(err);
            showToast("Error accepting task", true);
        }
    }
}
async function loadMyWork() {

    const { collection, getDocs, query, where } = firebaseFns;

    const userId = localStorage.getItem("userId");

    const container = document.getElementById("accepted-list");
    container.innerHTML = "<p>Loading...</p>";

    try {
        const q = query(
            collection(db, "tasks"),
            where("acceptedBy", "==", userId)
        );

        const snapshot = await getDocs(q);

        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = "<p>No tasks accepted yet</p>";
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();

            container.innerHTML += `
<div class="request-card">

    <div class="req-top">
        <h3>${data.title || "No Title"}</h3>
        <span class="status ${data.status}">${data.status}</span>
    </div>

    <div class="req-meta">
        <span>📂 ${data.category || "General"}</span>
        <span>👤 ${data.name || "User"}</span>
    </div>

    <div class="req-desc">
        ${data.description || "No description"}
    </div>

    <div class="req-contact">
        <span>📞 ${data.phone || "N/A"}</span>
        <span>🆔 ${data.roll || "N/A"}</span>
    </div>

    ${
        data.status !== "completed"
        ? `
        <div class="req-actions">
            <button onclick="completeTask('${docSnap.id}')"
class="btn-complete">
    💰 Mark Done
</button>
        </div>
        `
        : `<div class="completed-label">✅ Completed</div>`
    }

</div>
`;
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading work</p>";
    }
}

async function completeTask(taskId) {

    try {
        const { doc, updateDoc } = firebaseFns;

        await updateDoc(doc(db, "tasks", taskId), {
            status: "completed"
        });

        showToast("Task marked as completed!");

        loadMyWork();
        loadMyRequests();
        loadTasks();

    } catch (err) {
        console.error(err);
        showToast("Error updating task", true);
    }
}

function showSubscriptionPopup() {
    const modal = document.getElementById("modal");

    document.querySelector("#modal h2").innerText = "🚀 Upgrade to Pro";
    document.querySelector("#modal .modal-icon").innerText = "💎";

    document.getElementById("modal-info").innerHTML = `
        <div style="text-align:center;">
            <h3 style="color:#2ecc71;">Only ₹150 / month</h3>
            
            <p>You’ve reached your free limit (3 tasks).</p>
            
            <p><b>Unlock unlimited earning for just ₹150/month</b></p>

            <ul style="text-align:left; margin-top:10px;">
                <li>✔ Unlimited task acceptance</li>
                <li>✔ Priority visibility</li>
                <li>✔ Higher earning potential</li>
            </ul>

            <button onclick="upgradeToPro()" class="modal-btn" style="margin-top:10px;">
                Upgrade Now 🚀
            </button>
        </div>
    `;

    modal.classList.add("open");
}

async function upgradeToPro() {
    const userId = localStorage.getItem("userId");
    const { doc, updateDoc } = firebaseFns;

    await updateDoc(doc(db, "users", userId), {
        isPro: true
    });

    closeModal();
    showToast("You are now PRO 🚀");
}

async function showUsageInfo() {
    const userId = localStorage.getItem("userId");
    const { doc, getDoc } = firebaseFns;

    const snap = await getDoc(doc(db, "users", userId));
    const data = snap.data();

    showToast(`Used ${data.acceptedCount || 0}/3 free accepts`);
}
function closeModal() {
    document.getElementById("modal").classList.remove("open");
}

window.onclick = function(event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
        modal.classList.remove("open");
    }
};

