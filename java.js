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
        password,
        university: university.toLowerCase(),
        roll,
        dept,
        phone,
         acceptedCount: 0,
        isPro: false, 
        createdAt: new Date()
    });

  
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
            localStorage.setItem("userPhone", data.phone); 
            found = true;
            break; 
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

function checkUser() {
    const userId = localStorage.getItem("userId");

    console.log("checkUser running, userId:", userId); 

    const loginBtns = document.querySelectorAll(".nav-login");
    const registerBtns = document.querySelectorAll(".nav-register");
    const logoutBtns = document.querySelectorAll(".nav-logout");

    console.log("loginBtns:", loginBtns.length); 

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


function handlePostClick() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        showToast("Please login first to post a task", true);

        setTimeout(() => {
            showPage("login");
        }, 800);

        return;
    }

  
    showPage("post");
}


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


async function postTask() {
    const userId = localStorage.getItem("userId");
    const userUniversity = localStorage.getItem("userUniversity");
    const userRoll = localStorage.getItem("userRoll");

    if (!userId) {
        showToast("Login required", true);
        return;
    }

    const name = document.getElementById("f-name").value;
    const email = document.getElementById("f-email").value;
    const phone = document.getElementById("f-phone").value;
    const title = document.getElementById("f-title").value;
    const desc = document.getElementById("f-desc").value;
    const category = document.getElementById("f-category").value;
    const budget = document.getElementById("f-budget").value;

    if (!name || !email || !phone || !title || !desc || !category) {
        showToast("Please fill all fields", true);
        return;
    }

    try {
        const { collection, addDoc } = firebaseFns;

       
        const docRef = await addDoc(collection(db, "tasks"), {
            name,
            email,
            phone,
            title,
            description: desc,
            category,
            budget: budget || "0",
            userId,
            university: userUniversity,
            roll: userRoll || "N/A",
            status: "open",
            acceptedBy: "",
            createdAt: new Date()
        });

        const embedding = await getEmbedding(title + " " + desc);

       if (!embedding) {
    console.warn("Embedding failed, skipping Pinecone");
} else {
    await fetch("https://campuslink-backend-2.onrender.com/upsert", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: docRef.id,
            embedding,
            metadata: {
                title,
                description: desc,
                category,
                budget: budget || "0",
                userId,
                university: userUniversity,
                roll: userRoll || "N/A"
            }
        })
    });
}

        
        
        showToast("Task posted successfully 🚀");

        showPage("browse");
        loadTasks();

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

            
           if (data.status !== "open") return;

            const title = (data.title || "").toLowerCase();
            const desc = (data.description || "").toLowerCase();
            const cat = data.category || "Other";

          
            const matchesSearch =
                title.includes(searchText) ||
                desc.includes(searchText);

          
            const matchesCategory =
                selectedCategory === "All" || cat === selectedCategory;

            if (!matchesSearch || !matchesCategory) return;

            visibleCount++;

           
            if (categoryCount[cat] !== undefined) {
                categoryCount[cat]++;
            }

          
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

    
    document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));

  
    document.querySelectorAll(".sidebar-cat").forEach(b => b.classList.remove("active"));

    if (btn) btn.classList.add("active");

    loadTasks(); 
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

        loadMyRequests(); 
        loadTasks(); 

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

            
            if (!isPro && acceptedCount >= 3) {
                throw "LIMIT_REACHED";
            }

           
            const taskRef = doc(db, "tasks", taskId);
            const taskSnap = await transaction.get(taskRef);

            if (!taskSnap.exists()) throw "TASK_NOT_FOUND";

            if (taskSnap.data().status !== "open") {
                throw "TASK_TAKEN";
            }

            
            transaction.update(taskRef, {
                status: "accepted",
                acceptedBy: currentUser
            });

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




async function getEmbedding(text) {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: text })
      }
    );

    const data = await res.json();

    console.log("Embedding response:", data);

    if (!res.ok || data.error) {
      console.error("HF error:", data);
      return null;
    }

    if (!data || !Array.isArray(data) || !data[0]) return null;

    return data[0];

  } catch (err) {
    console.error("Embedding error:", err);
    return null;
  }
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}


async function findRelevantTask(userText) {
  const userEmbedding = await getEmbedding(userText);
  if (!userEmbedding) return null;

  const { collection, getDocs } = firebaseFns;
  const snapshot = await getDocs(collection(db, "tasks"));

  let bestMatch = null;
  let bestScore = 0; 

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.embedding) return;

    const score = cosineSimilarity(userEmbedding, data.embedding);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = data;
    }
  });

  console.log("BEST SCORE:", bestScore);

  if (bestScore < 0.5) {
    return null;
  }

  return bestMatch;
}




async function getEmbedding(text) {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    const data = await res.json();
    if (!data || !data[0]) return null;

    return data[0];

  } catch (err) {
    console.error("Embedding error:", err);
    return null;
  }
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function findRelevantTask(userText) {
  const userEmbedding = await getEmbedding(userText);
  if (!userEmbedding) return null;

  const { collection, getDocs } = firebaseFns;
  const snapshot = await getDocs(collection(db, "tasks"));

  let bestMatch = null;
  let bestScore = -1;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.embedding) return;

    const score = cosineSimilarity(userEmbedding, data.embedding);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = data;
    }
  });

  return bestScore > 0.5 ? bestMatch : null;
}



const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const CHATBOT_SYSTEM_PROMPT = `You are the friendly AI assistant for CampusLink — a student services marketplace that connects college students across India.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ROLE & PURPOSE
━━━━━━━━━━━━━━━━━━━━━━━━━━
You help students:
- Discover relevant tasks and earn money
- Post tasks they need help with
- Understand how CampusLink works
- Make smart decisions about upgrading to Pro
- Find answers to platform questions quickly

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 PLATFORM FACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tasks are college-specific (users only see tasks from their own campus)
- Free users can accept up to 3 tasks total
- Pro Plan: ₹150/month → unlimited task acceptance + priority visibility
- Task categories: Study Help, Errands, Transport, Food, Printouts, Tech Help, Creative, Projects
- Students can both post tasks (earn) and accept tasks (help others)
- Customer Care: 9056910305

━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMENDATIONS & SUGGESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━
When a user asks "what should I do?", "suggest something", "recommend tasks", or anything vague:
1. Ask 1-2 short clarifying questions: "What skills do you have?" / "How many hours free per day?"
2. Based on their answer, suggest a matching category (e.g. "You're good at coding? Go for Tech Help tasks!")
3. Recommend posting OR accepting based on their current need
4. If they're close to 3-task limit, gently mention Pro Plan
5. When someone asks to contact support, provide number - 9317449300 and email - sharmdevansh83@gmail.com 

When recommending specific task types, explain WHY it's a good fit for them.
━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 CHAT HISTORY MEMORY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━
You have access to conversation history.

Use it to:
- Remember user intent (earn money, post tasks, browse tasks)
- Avoid repeating questions already answered
- Maintain context across messages

Do NOT:
- Repeat full previous answers
- Ignore earlier user preferences
- Reset context unless user starts a new topic

If user refers to something like:
"that task", "it", "same one", "earlier message"
→ Always look at last relevant task or message

If confusion exists:
- Ask a short clarifying question instead of guessing
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TASK RECOMMENDATION LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━
When suggesting tasks:

Step 1: Understand user intent
- Earn money → suggest high budget tasks
- Quick work → simple tasks (printouts, errands)
- Skills → match (tech, design, study help)

Step 2: Personalization
- If beginner → suggest easy tasks
- If experienced → suggest higher paying tasks

Step 3: Output format
Always show:
- Title
- Category
- Budget
- Why it's suitable (1 line only)

Keep responses short and actionable.
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 RETRIEVAL-FIRST BEHAVIOR (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━

You are connected to a vector database (Pinecone) that returns real tasks.

RULES:
1. ALWAYS check retrieved tasks first.
2. If retrieved task EXISTS:
   - ONLY use that task data
   - DO NOT suggest posting or browsing
   - DO NOT give general CampusLink advice
   - Format response using task details only

3. If retrieved task is NULL:
   - Say clearly: "No matching tasks found in your campus feed."
   - THEN optionally suggest browsing categories (ONLY ONE LINE MAX)
   - DO NOT hallucinate tasks
   - DO NOT assume or give generic workflows

4. NEVER say:
   - "You can post a task"
   - "You can browse CampusLink"
   unless user explicitly asks HOW to use the app

5. Your job is NOT to guide platform usage.
   Your job is ONLY to interpret retrieved tasks.

━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 TASK SEARCH BEHAVIOR (RAG SYSTEM)
━━━━━━━━━━━━━━━━━━━━━━━━━━
You are connected to a retrieval system (vector database or Firebase tasks).

When user asks anything related to tasks:
- First assume tasks exist in database
- Try to match intent with stored tasks
- Prefer exact semantic match over keyword match

If partial match:
- Still show closest tasks
- Say: "Closest available tasks found"

If no match:
- Suggest category filter instead of stopping
━━━━━━━━━━━━━━━━━━━━━━━━━━
🧩 USER TASK HISTORY AWARENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━
If system provides user activity (accepted tasks, posted tasks):

Use it to:
- Avoid suggesting same task again
- Recommend similar but better-paid tasks
- Track user skill direction (tech, errands, etc.)

If user has accepted many tasks in one category:
→ assume skill strength in that category

If user is inactive:
→ suggest easy entry tasks to re-engage them

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ RESPONSE STYLE RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Maximum 5–8 lines per reply
- Use bullets for tasks
- Always prioritize clarity over explanation
- Act like a “task marketplace guide”, not a chatbot

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 BROWSING & SEARCHING TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━
If user wants to browse tasks:
- Guide them to their campus task feed
- Suggest filtering by categories that match their skills
- Explain what each category typically includes
- Remind them of their acceptance limit (free: 3 tasks)

━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 POSTING A TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━
If user wants to post a task:
1. Help them pick the right category
2. Suggest writing a clear, specific title
3. Remind them to set a fair budget (compare to similar tasks)
4. Advise on deadline — be realistic
5. Mention they can re-post if no one accepts in time
6. Warn: tasks violating community guidelines will be removed

━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ACCEPTING A TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━
If user wants to accept a task:
1. Remind them of the 3-task free limit
2. If at limit → explain Pro Plan (₹150/mo, unlimited accepts)
3. Advise: only accept tasks you can realistically complete
4. Mention: completing tasks on time builds your campus reputation
5. Let them know they can message the poster before accepting

━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 EARNING TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━
If user asks how to earn more or maximize income:
- Focus on high-demand categories: Printouts, Food, Study Help
- Accept tasks during busy hours (exam season, early morning, late evening)
- Build a good rating → more task offers come to you
- Pro Plan pays off if you accept 4+ tasks/month consistently
- Suggest combining task categories they're naturally good at
- "Treat it like a side hustle, not a gamble — consistency wins"

━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 PRO PLAN GUIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━
Suggest Pro Plan when:
- User has used 2 or 3 of their free task slots
- User says they want to earn regularly / more than 3 tasks
- User asks "is it worth it?"

How to pitch it:
- "If you accept just 2 paid tasks a month, Pro pays for itself"
- Highlight: no task limits, priority listing visibility
- Don't hard-sell — let the math speak

If user says "I can't afford it":
- Acknowledge that, don't push
- Suggest making the most of their 3 free slots wisely

━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 DISPUTES & ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━
If user reports a problem (task not completed, payment issue, rude poster, etc.):
1. Empathize first: "That sounds frustrating, let's sort this out."
2. Tell them to contact support: 9056910305
3. Advise documenting proof (screenshots, chat history)
4. Do NOT take sides or make promises about refunds/outcomes

━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 NEW USER ONBOARDING
━━━━━━━━━━━━━━━━━━━━━━━━━━
If user seems new (asks "how does this work?", "I just signed up", "what is CampusLink?"):
1. Give a warm 2-line intro: "CampusLink is your campus marketplace — post tasks, earn cash, get help!"
2. Walk them through 3 steps: Set up profile → Browse tasks → Accept or Post
3. Remind them: 3 free task accepts to start
4. Invite them to ask anything

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 ACCOUNT & PROFILE QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━
If user asks about account, login, password, profile:
- For technical account issues → direct to support: 9056910305
- For profile tips → suggest adding skills, a photo, and a short bio for credibility
- Remind: a complete profile gets more task offers

━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 OFF-TOPIC QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━
If user asks something unrelated to CampusLink:
- Answer briefly if it's a quick student life question (study tips, hostel advice, etc.)
- Gently steer back: "By the way, if you ever need help with [relevant thing], CampusLink might have someone on your campus!"
- Never go deep into politics, controversial topics, or non-student subjects

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ STRICT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━
- NEVER invent fake tasks, prices, or user data
- NEVER promise outcomes for disputes or refunds
- NEVER share personal data of other users
- Keep answers SHORT — 3-5 lines max unless explaining a process
- Always be encouraging — students are hustling, respect that

━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 TONE & PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Like a helpful senior who's been on CampusLink since day one
- Casual but not sloppy — clear, confident, friendly
- Use emojis occasionally (1-2 per message max)
- Celebrate small wins: "Nice, your first task is accepted! 🎉"
- If user is stressed → calm them down first, then solve

━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer Care: 9056910305
Share this when needed.
`;


let chatHistory = [];
let chatbotOpen = false;

function toggleChatbot() {
  chatbotOpen = !chatbotOpen;
  const panel = document.getElementById("chatbot-panel");

  if (chatbotOpen) {
    panel.classList.add("open");
    document.getElementById("chatbot-input").focus();
    scrollChatToBottom();
  } else {
    panel.classList.remove("open");
  }
}

function scrollChatToBottom() {
  const msgs = document.getElementById("chatbot-messages");
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function appendChatMessage(role, html) {
  const msgs = document.getElementById("chatbot-messages");
  const div = document.createElement("div");
  div.className = "chatbot-msg " + role;
  div.innerHTML = `<div class="chatbot-msg-bubble">${html}</div>`;
  msgs.appendChild(div);
  scrollChatToBottom();
}

function showTypingIndicator() {
  const msgs = document.getElementById("chatbot-messages");
  const div = document.createElement("div");
  div.className = "chatbot-msg bot";
  div.id = "typing";
  div.innerHTML = `<div class="chatbot-msg-bubble">Typing...</div>`;
  msgs.appendChild(div);
}

function removeTypingIndicator() {
  const el = document.getElementById("typing");
  if (el) el.remove();
}




async function sendChatMessage() {
  const input = document.getElementById("chatbot-input");
  const sendBtn = document.getElementById("chatbot-send-btn");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  input.disabled = true;
  sendBtn.disabled = true;

  appendChatMessage("user", escapeHtml(text));
  chatHistory.push({ role: "user", content: text });

  showTypingIndicator();

  try {
    
    const res = await fetch("http://localhost:5000/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: text })
    });

    const data = await res.json();
    const bestTask = data.bestMatch;

    console.log("BEST TASK:", bestTask);

  
    if (bestTask) {
      removeTypingIndicator();

      appendChatMessage("bot", `
        🎯 <b>Real Task Found:</b><br><br>
        <b>${bestTask.title}</b><br>
        ${bestTask.description}<br><br>
        💰 ₹${bestTask.budget || "0"}<br>
        📂 ${bestTask.category || "Other"}<br><br>
        🚀 Try accepting this task
      `);

      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
      return;
    }

   
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: CHATBOT_SYSTEM_PROMPT },
          ...chatHistory
        ],
        max_tokens: 512,
        temperature: 0.7
      })
    });

    const aiData = await response.json();
    removeTypingIndicator();

    if (aiData.choices && aiData.choices[0]) {
      const reply = aiData.choices[0].message.content.trim();
      chatHistory.push({ role: "assistant", content: reply });

      appendChatMessage("bot", formatChatReply(reply));
    } else {
      appendChatMessage("bot", "⚠️ No response from AI");
    }

  } catch (err) {
    removeTypingIndicator();
    console.error(err);
    appendChatMessage("bot", "⚠️ Error connecting system");
  }

  input.disabled = false;
  sendBtn.disabled = false;
  input.focus();
}
  


function formatChatReply(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


async function searchPinecone(query) {
  const res = await fetch("YOUR_BACKEND_URL/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  return data.bestMatch;
}